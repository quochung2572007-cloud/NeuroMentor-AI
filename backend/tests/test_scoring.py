import json
import unittest
from pathlib import Path

from pydantic import ValidationError

from app.schemas.intelligence import CognitiveContext, CognitivePredictionResponse, MentorResponse
from app.schemas.usage import UsagePayload
from app.services.intelligence_engine import (
    build_mentor_response,
    mentor_intent,
    mentor_language,
    predict_cognitive_state,
)
from app.services.scoring import calculate_scores, normalize_usage, score_band, validate_context

FIXTURES = json.loads(
    (Path(__file__).parents[2] / "tests" / "fixtures" / "scoring_cases.json").read_text(
        encoding="utf-8"
    )
)


class ScoringTests(unittest.TestCase):
    def test_normalization_is_pure_and_clamps_negative_values(self) -> None:
        source = {"social": -8, "productivity": 20}
        normalized = normalize_usage(source)
        self.assertEqual(normalized["social"], 0)
        self.assertEqual(normalized["productivity"], 20)
        self.assertEqual(source["social"], -8)

    def test_reported_total_must_match_category_total(self) -> None:
        validation = validate_context(
            {"social": 60, "entertainment": 30}, reported_total_minutes=120
        )
        self.assertFalse(validation["valid"])
        self.assertIn("add up to 90 minutes", validation["errors"][0])

    def test_shared_score_bands_use_product_guidance_thresholds(self) -> None:
        self.assertEqual(score_band("focus", 34)["key"], "needs-attention")
        self.assertEqual(score_band("focus", 35)["key"], "building")
        self.assertEqual(score_band("focus", 55)["key"], "steady")
        self.assertEqual(score_band("focus", 75)["key"], "strong")
        self.assertEqual(score_band("fatigue", 44)["key"], "moderate")
        self.assertEqual(score_band("fatigue", 45)["key"], "watch")
        self.assertEqual(score_band("fatigue", 70)["key"], "high")
        self.assertEqual(score_band("distraction", 44)["key"], "moderate")
        self.assertEqual(score_band("distraction", 45)["key"], "watch")
        self.assertEqual(score_band("distraction", 70)["key"], "high")
        self.assertEqual(score_band("burnout", 49)["key"], "moderate")
        self.assertEqual(score_band("burnout", 50)["key"], "elevated")
        self.assertEqual(score_band("burnout", 75)["key"], "high")

    def test_score_alerts_require_sufficient_context(self) -> None:
        incomplete = predict_cognitive_state({"games": 600})
        self.assertEqual(incomplete.alerts[0].alert_type, "context_quality")
        self.assertEqual(incomplete.alerts[0].severity, "info")

        complete = predict_cognitive_state(
            {"games": 600},
            app_switches=50,
            late_night_minutes=60,
            deep_work_minutes=25,
            launch_count=20,
        )
        self.assertEqual(complete.alerts[0].alert_type, "focus_signal")
        self.assertEqual(complete.alerts[0].severity, "high")
        self.assertTrue(complete.alerts[0].action)

        supported = predict_cognitive_state(
            {"productivity": 120}, app_switches=5, deep_work_minutes=30
        )
        self.assertEqual(supported.alerts, [])

    def test_empty_context_has_zero_scores(self) -> None:
        result = calculate_scores({})
        self.assertEqual(result["focus_score"], 0)
        self.assertEqual(result["fatigue_score"], 0)
        self.assertEqual(result["distraction_score"], 0)
        self.assertEqual(result["burnout_score"], 0)

    def test_shared_scoring_fixtures(self) -> None:
        for fixture in FIXTURES:
            with self.subTest(fixture=fixture["name"]):
                result = calculate_scores(**fixture["context"])
                expected = fixture["expected"]
                self.assertEqual(result["focus_score"], expected["focus_score"])
                self.assertEqual(result["fatigue_score"], expected["fatigue_score"])
                self.assertEqual(result["distraction_score"], expected["distraction_score"])
                self.assertEqual(result["burnout_score"], expected["burnout_score"])
                self.assertEqual(round(result["confidence"] * 100), expected["confidence_percent"])
                self.assertEqual(result["total_minutes"], expected["total_minutes"])

    def test_prediction_matches_api_response_contract(self) -> None:
        prediction = predict_cognitive_state(**FIXTURES[0]["context"])
        response = CognitivePredictionResponse.model_validate(prediction.to_dict())
        self.assertEqual(response.focus_score, 47)

    def test_focus_changes_with_category_mix_and_screen_load(self) -> None:
        social = calculate_scores({"social": 120})["focus_score"]
        games = calculate_scores({"games": 120})["focus_score"]
        entertainment = calculate_scores({"entertainment": 120})["focus_score"]
        long_gaming = calculate_scores({"games": 600})["focus_score"]
        self.assertEqual([social, games, entertainment], [39, 31, 37])
        self.assertEqual(len({social, games, entertainment}), 3)
        self.assertLess(long_gaming, games)

    def test_usage_schema_rejects_more_than_one_day(self) -> None:
        with self.assertRaises(ValidationError):
            UsagePayload(social=800, entertainment=700)

    def test_context_schema_rejects_total_mismatch(self) -> None:
        with self.assertRaises(ValidationError):
            CognitiveContext(
                usage=UsagePayload(social=60),
                reported_total_minutes=90,
            )


class MentorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.result = predict_cognitive_state(**FIXTURES[0]["context"])

    def test_required_questions_map_to_different_intents(self) -> None:
        questions = {
            "How might I feel?": "feel",
            "What should I do?": "action",
            "Why did my focus change?": "explain",
            "Plan tomorrow": "plan",
        }
        for question, expected in questions.items():
            with self.subTest(question=question):
                self.assertEqual(mentor_intent(question), expected)

    def test_required_questions_produce_distinct_responses(self) -> None:
        questions = [
            "How might I feel?",
            "What should I do?",
            "Why did my focus change?",
            "Plan tomorrow",
        ]
        answers = {build_mentor_response(question, self.result)["answer"] for question in questions}
        self.assertEqual(len(answers), len(questions))

    def test_feeling_response_does_not_infer_emotion_or_condition(self) -> None:
        response = build_mentor_response("How might I feel?", self.result)
        self.assertIn("cannot determine how you feel", response["answer"])
        combined = f"{response['answer']} {response['disclaimer']}".lower()
        self.assertNotIn("you have adhd", combined)
        self.assertNotIn("you have depression", combined)
        self.assertNotIn("you have burnout", combined)

    def test_recent_history_changes_explanation(self) -> None:
        response = build_mentor_response(
            "Why did my focus change?",
            self.result,
            [{"date": "2026-06-19", "focus_score": 60, "fatigue_score": 20}],
        )
        self.assertIn("13 points lower", response["answer"])

    def test_mentor_response_matches_api_contract(self) -> None:
        response = MentorResponse.model_validate(
            build_mentor_response("Plan tomorrow", self.result)
        )
        self.assertTrue(response.next_steps)

    def test_vietnamese_questions_use_vietnamese_intents_and_responses(self) -> None:
        questions = {
            "Tôi có thể cảm thấy thế nào?": "feel",
            "Tôi nên làm gì?": "action",
            "Tại sao điểm tập trung thay đổi?": "explain",
            "Lập kế hoạch ngày mai": "plan",
        }
        for question, expected_intent in questions.items():
            with self.subTest(question=question):
                self.assertEqual(mentor_language(question), "vi")
                self.assertEqual(mentor_intent(question), expected_intent)
                response = build_mentor_response(question, self.result)
                self.assertEqual(response["language"], "vi")
                self.assertNotIn("Screen-time metadata", response["answer"])

    def test_unaccented_vietnamese_is_detected(self) -> None:
        response = build_mentor_response("Toi nen lam gi ngay mai?", self.result)
        self.assertEqual(response["language"], "vi")
        self.assertIn("Kế hoạch", response["answer"])

    def test_daily_summary_intent_handles_natural_and_imperfect_questions(self) -> None:
        english_questions = (
            "Analyze today",
            "Can you summarize the analyze me today?",
            "Give me today's summary",
        )
        for question in english_questions:
            with self.subTest(question=question):
                self.assertEqual(mentor_intent(question), "daily_summary")
                response = build_mentor_response(question, self.result)
                self.assertEqual(response["language"], "en")
                self.assertIn("Today's summary", response["answer"])
                self.assertIn(f"focus {self.result.focus_score}/100", response["answer"])
                self.assertIn("Priority action", response["answer"])

        vietnamese_questions = ("Tóm tắt hôm nay", "Tom tat ngay hom nay")
        for question in vietnamese_questions:
            with self.subTest(question=question):
                self.assertEqual(mentor_language(question), "vi")
                self.assertEqual(mentor_intent(question), "daily_summary")
                response = build_mentor_response(question, self.result)
                self.assertIn("Tóm tắt hôm nay", response["answer"])
                self.assertIn("Hành động ưu tiên", response["answer"])

    def test_basic_conversation_does_not_repeat_default_report(self) -> None:
        acknowledgement = build_mentor_response("oke", self.result)
        self.assertEqual(mentor_intent("oke"), "acknowledge")
        self.assertEqual(acknowledgement["language"], "vi")
        self.assertEqual(acknowledgement["evidence"], [])
        self.assertEqual(acknowledgement["next_steps"], [])
        self.assertNotIn("ước tính tập trung", acknowledgement["answer"].lower())

        reduction = build_mentor_response(
            "Tôi có nên giảm bớt thời gian sử dụng không?", self.result
        )
        self.assertEqual(
            mentor_intent("Tôi có nên giảm bớt thời gian sử dụng không?"),
            "screen_time",
        )
        self.assertRegex(reduction["answer"], r"giảm khoảng|không cần cắt giảm mạnh")
        self.assertNotIn("Mình chưa hiểu rõ", reduction["answer"])


if __name__ == "__main__":
    unittest.main()
