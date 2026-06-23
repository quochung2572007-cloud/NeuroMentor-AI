"""Adapters for cognitive scoring and deterministic Mentor coaching."""

from __future__ import annotations

import unicodedata
from dataclasses import asdict, dataclass

from app.services.scoring import (
    CATEGORY_LABELS,
    PrimaryAction,
    calculate_scores,
)

VI_CATEGORY_LABELS = {
    "social": "Mạng xã hội",
    "productivity": "Công việc",
    "games": "Trò chơi",
    "learning": "Học tập",
    "health": "Sức khỏe",
    "entertainment": "Giải trí",
}


@dataclass
class AlertResult:
    alert_type: str
    severity: str
    title: str
    message: str
    reason: str
    action: str


@dataclass
class CognitiveResult:
    focus_score: int
    fatigue_score: int
    distraction_score: int
    burnout_score: int
    burnout_risk: str
    confidence: float
    total_minutes: int
    productive_ratio: float
    social_ratio: float
    recovery_ratio: float
    deep_work_ratio: float
    late_night_ratio: float
    switch_rate: float
    top_category: str
    usage: dict[str, int]
    insights: list[str]
    recommendations: list[str]
    alerts: list[AlertResult]
    features: dict[str, float | int | str]
    primary_action: PrimaryAction
    model_version: str = "shared-snapshot-v1"

    def to_dict(self) -> dict:
        result = asdict(self)
        result["alerts"] = [asdict(alert) for alert in self.alerts]
        return result


def predict_cognitive_state(
    usage: dict[str, int],
    *,
    app_switches: int = 0,
    late_night_minutes: int = 0,
    deep_work_minutes: int = 0,
    launch_count: int = 0,
) -> CognitiveResult:
    scores = calculate_scores(
        usage,
        app_switches=app_switches,
        late_night_minutes=late_night_minutes,
        deep_work_minutes=deep_work_minutes,
        launch_count=launch_count,
    )
    alerts: list[AlertResult] = []
    if app_switches >= 50:
        alerts.append(
            AlertResult(
                alert_type="attention_switching",
                severity="medium",
                title="Frequent app switching",
                message="Frequent switching is associated with more fragmented work sessions.",
                reason=f"{app_switches} app switches were recorded.",
                action="Use focus mode for one 25-minute block and keep only the required app open.",
            )
        )

    return CognitiveResult(
        focus_score=int(scores["focus_score"]),
        fatigue_score=int(scores["fatigue_score"]),
        distraction_score=int(scores["distraction_score"]),
        burnout_score=int(scores["burnout_score"]),
        burnout_risk=str(scores["burnout_risk"]),
        confidence=float(scores["confidence"]),
        total_minutes=int(scores["total_minutes"]),
        productive_ratio=float(scores["productive_ratio"]),
        social_ratio=float(scores["social_ratio"]),
        recovery_ratio=float(scores["recovery_ratio"]),
        deep_work_ratio=float(scores["deep_work_ratio"]),
        late_night_ratio=float(scores["late_night_ratio"]),
        switch_rate=float(scores["switch_rate"]),
        top_category=str(scores["top_category"]),
        usage=dict(scores["usage"]),
        insights=list(scores["insights"]),
        recommendations=list(scores["recommendations"]),
        alerts=alerts,
        features=dict(scores["features"]),
        primary_action=scores["primary_action"],
    )


def _normalize_mentor_text(question: str) -> str:
    normalized = unicodedata.normalize("NFD", question).lower()
    return "".join(character for character in normalized if not unicodedata.combining(character)).replace("đ", "d").strip()


def mentor_language(question: str) -> str:
    source = question.lower()
    normalized = _normalize_mentor_text(question)
    vietnamese_characters = "ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ"
    vietnamese_phrases = (
        "toi nen", "lam gi", "tai sao", "vi sao", "ngay mai", "cam thay",
        "tap trung", "met moi", "xao nhang", "kiet suc", "xu huong", "giup toi",
    )
    return "vi" if any(character in source for character in vietnamese_characters) or any(
        phrase in normalized for phrase in vietnamese_phrases
    ) else "en"


def mentor_intent(question: str) -> str:
    normalized = _normalize_mentor_text(question)

    def contains(*terms: str) -> bool:
        return any(term in normalized for term in terms)

    if contains("plan tomorrow", "tomorrow plan", "plan my day", "tomorrow", "ke hoach ngay mai", "ngay mai"):
        return "plan"
    if contains("why", "change", "cause", "reason", "contributor", "tai sao", "vi sao", "thay doi", "nguyen nhan"):
        return "explain"
    if contains("how might i feel", "how will i feel", "how i feel", "feel today", "emotion", "cam thay", "tam trang"):
        return "feel"
    if contains("what should i do", "what can i do", "next step", "recommend", "help me", "toi nen lam gi", "nen lam gi", "loi khuyen", "giup toi"):
        return "action"
    if contains("trend", "week", "history", "improving", "baseline", "xu huong", "tuan", "lich su"):
        return "trend"
    if contains("score", "focus", "fatigue", "distraction", "burnout", "diem", "tap trung", "met moi", "xao nhang", "kiet suc"):
        return "metric"
    return "general"


def _history_sentence(result: CognitiveResult, recent_history: list[dict]) -> str:
    previous = next(
        (
            entry
            for entry in reversed(recent_history)
            if isinstance(entry.get("focus_score"), (int, float))
        ),
        None,
    )
    if previous is None:
        return "More daily snapshots are needed before a personal trend can be described."
    change = result.focus_score - int(previous["focus_score"])
    if change == 0:
        return "Your focus estimate is unchanged from the previous saved day."
    direction = "higher" if change > 0 else "lower"
    return f"Your focus estimate is {abs(change)} points {direction} than the previous saved day."


def _history_sentence_vi(result: CognitiveResult, recent_history: list[dict]) -> str:
    previous = next(
        (entry for entry in reversed(recent_history) if isinstance(entry.get("focus_score"), (int, float))),
        None,
    )
    if previous is None:
        return "Cần thêm ảnh chụp hằng ngày trước khi có thể mô tả xu hướng cá nhân."
    change = result.focus_score - int(previous["focus_score"])
    if change == 0:
        return "Ước tính tập trung không đổi so với ngày đã lưu trước đó."
    direction = "cao hơn" if change > 0 else "thấp hơn"
    return f"Ước tính tập trung {direction} {abs(change)} điểm so với ngày đã lưu trước đó."


def _vietnamese_action(result: CognitiveResult) -> str:
    actions = {
        "late-night": "Chuyển 30 phút sử dụng màn hình ban đêm sang sớm hơn và đặt giờ dừng rõ ràng.",
        "deep-work": "Dành 25 phút cho việc học hoặc công việc ưu tiên trước khi mở ứng dụng giải trí.",
        "social": "Chọn một khung giờ dùng mạng xã hội và không mở ứng dụng trong 20 phút đầu ngày.",
        "games": "Hoàn thành một việc ưu tiên trong 20 phút trước phiên chơi tiếp theo.",
        "entertainment": "Hoàn thành một việc ưu tiên trong 20 phút trước phiên giải trí tiếp theo.",
        "switching": "Bật chế độ tập trung trong 25 phút và chỉ mở ứng dụng cần thiết.",
        "productive-ratio": "Dùng 20 phút đầu ngày mai cho công việc, lập kế hoạch hoặc học tập.",
        "maintain": "Lặp lại khung tập trung hiệu quả nhất vào cùng thời điểm ngày mai.",
    }
    return actions.get(result.primary_action["key"], "Chọn một thay đổi nhỏ và có thể lặp lại vào ngày mai.")


def build_mentor_response(
    question: str,
    result: CognitiveResult,
    recent_history: list[dict] | None = None,
) -> dict[str, str | list[str]]:
    history = recent_history or []
    language = mentor_language(question)
    intent = mentor_intent(question)
    action = result.primary_action["action"]
    reason = result.primary_action["reason"]
    category = CATEGORY_LABELS.get(result.top_category, "No category")
    category_share = result.usage.get(result.top_category, 0) / max(result.total_minutes, 1)
    trend = _history_sentence(result, history)

    if language == "vi":
        category_vi = VI_CATEGORY_LABELS.get(result.top_category, "Danh mục chính")
        evidence_vi = f"{category_vi} chiếm {category_share:.0%} thời gian màn hình đã ghi nhận."
        action_vi = _vietnamese_action(result)
        trend_vi = _history_sentence_vi(result, history)
        if result.total_minutes == 0:
            answer = (
                "Mình chưa có ảnh chụp dữ liệu hợp lệ để trả lời dựa trên thông tin của bạn. "
                "Hãy kiểm tra và lưu tổng thời gian hôm nay trước."
            )
        elif intent == "feel":
            answer = (
                "Dữ liệu thời gian màn hình không thể xác định chính xác cảm xúc của bạn. "
                f"Dữ liệu chỉ cho thấy {category_vi} chiếm {category_share:.0%} thời gian sử dụng "
                f"và ước tính tập trung là {result.focus_score}/100. Hãy tự kiểm tra xem lúc này "
                "bạn đang tràn đầy năng lượng, bình thường, phân tán hay mệt mỏi."
            )
        elif intent == "action":
            answer = f"Bước hữu ích nhất lúc này là: {action_vi} Đây là một thay đổi nhỏ, cụ thể và dễ lặp lại."
        elif intent == "explain":
            answer = (
                f"Ước tính tập trung hiện tại là {result.focus_score}/100. {evidence_vi} {trend_vi} "
                "Đây chỉ là mối liên hệ trong dữ liệu sử dụng, không phải bằng chứng về cảm xúc "
                "hay tình trạng y khoa."
            )
        elif intent == "plan":
            answer = f"Kế hoạch cho ngày mai: {action_vi} Sau đó hãy nghỉ ngắn và chỉ thêm một phiên tập trung nữa nếu phù hợp."
        elif intent == "trend":
            answer = trend_vi
        elif intent == "metric":
            answer = (
                f"Ước tính tập trung mới nhất là {result.focus_score}/100 với độ tin cậy "
                f"{round(result.confidence * 100)}%. {evidence_vi} {trend_vi}"
            )
        else:
            answer = (
                "Mình có thể giải thích điểm số hôm nay, yếu tố ảnh hưởng mạnh nhất hoặc lập một "
                f"kế hoạch nhỏ cho ngày mai. {evidence_vi}"
            )
        return {
            "language": "vi",
            "answer": answer,
            "evidence": [evidence_vi],
            "next_steps": [action_vi],
            "disclaimer": (
                "Dữ liệu thời gian màn hình không thể chẩn đoán cảm xúc, kiệt sức, ADHD, "
                "trầm cảm hoặc tình trạng y khoa hay sức khỏe tinh thần khác."
            ),
        }

    if result.total_minutes == 0:
        answer = (
            "I do not have a complete saved snapshot to reason from yet. Review today's category "
            "totals and save them, then I can explain the strongest pattern without guessing."
        )
    elif intent == "feel":
        answer = (
            "Screen-time metadata cannot determine how you feel. It only shows that "
            f"{category} represented {category_share:.0%} of recorded use and your focus estimate "
            f"is {result.focus_score}/100. Use that as a prompt to check in with yourself: do you "
            "feel energized, neutral, scattered, or tired right now?"
        )
    elif intent == "action":
        answer = f"{result.primary_action['title']}. {action} This is the clearest next step because {reason.lower()}"
    elif intent == "explain":
        answer = (
            f"The focus estimate is {result.focus_score}/100. {result.insights[0]} {trend} "
            "These are associations in usage data, not proof of an emotion or medical condition."
        )
    elif intent == "plan":
        answer = (
            f"Tomorrow, start with this one anchor: {action} Afterward, take a short break and "
            "decide whether another focus block is realistic. The plan stays intentionally small "
            "so it is easier to repeat."
        )
    elif intent == "trend":
        answer = trend
    elif intent == "metric":
        answer = (
            f"Your latest focus estimate is {result.focus_score}/100 with "
            f"{round(result.confidence * 100)}% model confidence. {result.insights[0]} {trend}"
        )
    else:
        answer = (
            "I can help explain today's estimate, identify the strongest contributor, or make a "
            f"small plan for tomorrow. For the latest snapshot, {result.insights[0].lower()}"
        )

    return {
        "language": "en",
        "answer": answer,
        "evidence": result.insights[:2],
        "next_steps": [action],
        "disclaimer": (
            "Screen-time metadata cannot diagnose emotions, burnout, ADHD, depression, or other "
            "medical or mental-health conditions."
        ),
    }
