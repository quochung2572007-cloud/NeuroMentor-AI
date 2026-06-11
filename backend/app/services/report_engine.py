"""Server-side report adapter for the shared cognitive intelligence rules."""

from dataclasses import dataclass

from app.services.intelligence_engine import CATEGORIES, predict_cognitive_state



@dataclass
class ReportResult:
    total_minutes: int
    time_level: str
    brain_level: str
    intensity: float
    brain_score: int
    warnings: list[str]
    suggestions: list[str]
    notes: list[str]
    usage: dict[str, int]
    features: dict[str, float | int]


def analyze_usage(usage: dict[str, int]) -> ReportResult:
    prediction = predict_cognitive_state(usage)
    normalized = prediction.usage
    total_minutes = prediction.total_minutes
    intensity = round(
        (
            prediction.focus_score
            + (100 - prediction.fatigue_score)
            + (100 - prediction.distraction_score)
        )
        / 300,
        4,
    )

    if total_minutes > 300:
        time_level = "High"
    elif total_minutes > 150:
        time_level = "Moderate"
    else:
        time_level = "Low"

    if prediction.focus_score >= 70:
        brain_level = "Focused"
    elif prediction.focus_score >= 45:
        brain_level = "Mixed"
    else:
        brain_level = "Distracted"

    warnings = [alert.message for alert in prediction.alerts]
    if not warnings:
        warnings = ["No elevated behavioral risk signals were detected today."]

    return ReportResult(
        total_minutes=total_minutes,
        time_level=time_level,
        brain_level=brain_level,
        intensity=round(intensity, 4),
        brain_score=prediction.focus_score,
        warnings=warnings,
        suggestions=prediction.recommendations,
        notes=prediction.insights,
        usage=normalized,
        features=prediction.features
        | {
            "focus_score": prediction.focus_score,
            "fatigue_score": prediction.fatigue_score,
            "distraction_score": prediction.distraction_score,
            "burnout_score": prediction.burnout_score,
            "burnout_risk": prediction.burnout_risk,
        },
    )
