from dataclasses import asdict, dataclass


CATEGORIES = (
    "social",
    "productivity",
    "games",
    "learning",
    "health",
    "entertainment",
)


def _clamp(value: float, minimum: float = 0, maximum: float = 100) -> int:
    return int(round(max(minimum, min(maximum, value))))


def _ratio(value: int, total: int) -> float:
    return value / max(total, 1)


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
    model_version: str = "hybrid-rules-v2"

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
    normalized = {category: max(0, int(usage.get(category, 0))) for category in CATEGORIES}
    total_minutes = sum(normalized.values())

    productive_minutes = normalized["productivity"] + normalized["learning"]
    leisure_minutes = normalized["social"] + normalized["games"] + normalized["entertainment"]
    productive_ratio = _ratio(productive_minutes, total_minutes)
    social_ratio = _ratio(normalized["social"], total_minutes)
    entertainment_ratio = _ratio(
        normalized["games"] + normalized["entertainment"], total_minutes
    )
    recovery_ratio = _ratio(normalized["health"], total_minutes)
    deep_work_ratio = _ratio(deep_work_minutes, total_minutes)
    late_night_ratio = _ratio(late_night_minutes, total_minutes)
    usage_hours = max(total_minutes / 60, 1)
    switch_rate = app_switches / usage_hours
    launch_rate = launch_count / usage_hours

    switch_penalty = min(28, switch_rate * 1.7)
    launch_penalty = min(12, launch_rate * 0.35)
    late_penalty = min(24, late_night_ratio * 45)
    overload_penalty = min(22, max(0, total_minutes - 240) / 12)

    focus_score = _clamp(
        42
        + productive_ratio * 48
        + deep_work_ratio * 24
        + recovery_ratio * 10
        - social_ratio * 20
        - entertainment_ratio * 16
        - switch_penalty
        - late_penalty
    )

    fatigue_score = _clamp(
        12
        + overload_penalty * 2.1
        + late_night_ratio * 48
        + entertainment_ratio * 15
        + min(14, switch_rate * 0.9)
        - recovery_ratio * 24
    )

    distraction_score = _clamp(
        8
        + social_ratio * 38
        + entertainment_ratio * 34
        + switch_penalty * 1.45
        + launch_penalty
        - deep_work_ratio * 24
    )

    burnout_score = _clamp(
        fatigue_score * 0.52
        + distraction_score * 0.18
        + late_night_ratio * 24
        + max(0, total_minutes - 360) / 8
        + max(0, productive_ratio - 0.75) * 20
        - recovery_ratio * 15
    )

    if total_minutes == 0:
        focus_score = 0
        fatigue_score = 0
        distraction_score = 0
        burnout_score = 0

    if burnout_score >= 70:
        burnout_risk = "high"
    elif burnout_score >= 42:
        burnout_risk = "moderate"
    else:
        burnout_risk = "low"

    top_category = max(normalized, key=normalized.get) if total_minutes else "none"
    telemetry_fields = sum(
        value > 0 for value in (app_switches, late_night_minutes, deep_work_minutes, launch_count)
    )
    confidence = round(min(0.92, 0.68 + telemetry_fields * 0.06), 2)

    insights: list[str] = []
    recommendations: list[str] = []
    alerts: list[AlertResult] = []

    if productive_ratio >= 0.5:
        insights.append(
            f"Productive and learning activity made up {productive_ratio:.0%} of screen time."
        )
    elif total_minutes:
        insights.append(
            f"Only {productive_ratio:.0%} of screen time supported focused work or learning."
        )

    if deep_work_minutes >= 50:
        insights.append(f"You logged {deep_work_minutes} minutes of deeper focus activity.")
    elif total_minutes:
        insights.append("No sustained deep-work block was recorded for this day.")

    if switch_rate >= 12:
        insights.append(
            f"Your switching rate was {switch_rate:.1f} changes per screen-time hour."
        )
        alerts.append(
            AlertResult(
                alert_type="attention_fragmentation",
                severity="high" if switch_rate >= 20 else "medium",
                title="Attention fragmentation",
                message="Frequent app switching can make it harder to settle into demanding work.",
                reason=f"Estimated switching rate: {switch_rate:.1f} per hour.",
                action="Silence nonessential notifications and protect one 25-minute focus block.",
            )
        )

    if social_ratio >= 0.35:
        alerts.append(
            AlertResult(
                alert_type="excessive_social_media",
                severity="high" if social_ratio >= 0.5 else "medium",
                title="Social overload",
                message="Social apps are taking a large share of today's attention.",
                reason=f"Social usage represented {social_ratio:.0%} of total screen time.",
                action="Set one social check-in window and move the apps off the home screen.",
            )
        )

    if late_night_minutes >= 90:
        insights.append(f"{late_night_minutes} minutes of use happened late at night.")
        alerts.append(
            AlertResult(
                alert_type="sleep_disruption",
                severity="high" if late_night_minutes >= 180 else "medium",
                title="Recovery may be disrupted",
                message="Late-night screen use can reduce the quality of mental recovery.",
                reason=f"Late-night usage reached {late_night_minutes} minutes.",
                action="Create a 30-minute screen-free buffer before sleep tonight.",
            )
        )

    if burnout_risk == "high":
        alerts.append(
            AlertResult(
                alert_type="burnout_warning",
                severity="high",
                title="Elevated overload pattern",
                message="Today's pattern combines fatigue, screen load, and limited recovery signals.",
                reason=f"Burnout tendency score reached {burnout_score}/100.",
                action="Reduce optional screen load and schedule a real recovery block.",
            )
        )

    if recovery_ratio < 0.08 and total_minutes >= 120:
        recommendations.append("Add a short walk, breathing session, or device-free recovery break.")
    if distraction_score >= 55:
        recommendations.append("Use Focus mode for 25 minutes and keep only one task visible.")
    if fatigue_score >= 55:
        recommendations.append("Move demanding work earlier and stop high-stimulation use before bed.")
    if productive_ratio < 0.4 and total_minutes:
        recommendations.append("Reserve the first 30 minutes tomorrow for learning or priority work.")
    if total_minutes and deep_work_minutes < 50:
        recommendations.append("Schedule one uninterrupted 25-minute deep-work block tomorrow.")
    if not total_minutes:
        recommendations.append("Add today's usage to create your first personal baseline.")
    if not recommendations:
        recommendations.append("Keep the current balance and protect the habits that supported it.")

    if not insights:
        insights.append("Add today's usage to establish your first cognitive baseline.")

    features: dict[str, float | int | str] = {
        "total_minutes": total_minutes,
        "productive_ratio": round(productive_ratio, 4),
        "social_ratio": round(social_ratio, 4),
        "entertainment_ratio": round(entertainment_ratio, 4),
        "recovery_ratio": round(recovery_ratio, 4),
        "deep_work_ratio": round(deep_work_ratio, 4),
        "late_night_ratio": round(late_night_ratio, 4),
        "switch_rate": round(switch_rate, 2),
        "launch_rate": round(launch_rate, 2),
        "top_category": top_category,
    }

    return CognitiveResult(
        focus_score=focus_score,
        fatigue_score=fatigue_score,
        distraction_score=distraction_score,
        burnout_score=burnout_score,
        burnout_risk=burnout_risk,
        confidence=confidence,
        total_minutes=total_minutes,
        productive_ratio=round(productive_ratio, 4),
        social_ratio=round(social_ratio, 4),
        recovery_ratio=round(recovery_ratio, 4),
        deep_work_ratio=round(deep_work_ratio, 4),
        late_night_ratio=round(late_night_ratio, 4),
        switch_rate=round(switch_rate, 2),
        top_category=top_category,
        usage=normalized,
        insights=insights,
        recommendations=recommendations,
        alerts=alerts,
        features=features,
    )


def build_mentor_response(question: str, result: CognitiveResult) -> dict[str, str | list[str]]:
    normalized_question = question.lower()
    category = result.top_category.replace("_", " ").title()
    category_minutes = result.usage.get(result.top_category, 0)
    category_share = category_minutes / max(result.total_minutes, 1)
    focus_step = next(
        (
            item
            for item in result.recommendations
            if any(word in item.lower() for word in ("focus", "deep-work", "learning", "priority work"))
        ),
        None,
    )
    recovery_step = next(
        (
            item
            for item in result.recommendations
            if any(word in item.lower() for word in ("walk", "recovery", "screen-free", "earlier", "bed"))
        ),
        None,
    )
    next_step = (
        result.recommendations[0]
        if result.recommendations
        else "Protect one short, interruption-free focus block tomorrow."
    )

    if any(word in normalized_question for word in ("distract", "focus", "switch")):
        answer = (
            f"{category} took the largest share of your attention at {category_share:.0%}. "
            "That matters because a concentrated block of high-stimulation use can leave fewer "
            "opportunities for attention to settle. "
            f"{focus_step or next_step}"
        )
    elif any(word in normalized_question for word in ("tired", "fatigue", "energy", "sleep")):
        answer = (
            f"Today's energy pressure came from {result.total_minutes} minutes of screen load "
            "combined with the recovery signals available in your snapshot. "
            f"You do not need to change everything at once: {recovery_step or next_step}"
        )
    elif any(word in normalized_question for word in ("burnout", "overload", "stress")):
        answer = (
            f"Your current pattern suggests {result.burnout_risk} behavioral overload pressure. "
            "The useful question is whether screen load is being balanced by recovery, not whether "
            f"the label is good or bad. {recovery_step or next_step}"
        )
    else:
        answer = (
            f"{category} represented {category_share:.0%} of today's screen time. "
            f"The highest-leverage next move is small and specific: {next_step}"
        )

    return {
        "answer": answer,
        "evidence": result.insights[:3],
        "next_steps": result.recommendations[:2],
        "disclaimer": (
            "NeuroMentor estimates behavioral patterns from usage metadata and does not diagnose "
            "medical or mental-health conditions."
        ),
    }
