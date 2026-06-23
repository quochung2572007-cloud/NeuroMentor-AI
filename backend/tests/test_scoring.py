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
from app.services.scoring import calculate_scores, normalize_usage, validate_context

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
        self.assertEqual(response.focus_score, 33)

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
            [{"date": "2026-06-19", "focus_score": 45, "fatigue_score": 20}],
        )
        self.assertIn("12 points lower", response["answer"])

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


if __name__ == "__main__":
    unittest.main()
