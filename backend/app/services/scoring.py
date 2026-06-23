"""Pure cognitive scoring and validation helpers.

These functions accept plain values and have no database, HTTP, or user-session side effects.
The browser's ``core.js`` mirrors these rules for offline analysis.
"""

from __future__ import annotations

from math import floor
from typing import TypedDict

CATEGORIES = (
    "social",
    "productivity",
    "games",
    "learning",
    "health",
    "entertainment",
)

CATEGORY_LABELS = {
    "social": "Social",
    "productivity": "Productivity",
    "games": "Games",
    "learning": "Learning",
    "health": "Health",
    "entertainment": "Entertainment",
    "none": "No category",
}


class ValidationResult(TypedDict):
    valid: bool
    errors: list[str]
    warnings: list[str]
    category_total_minutes: int
    reported_total_minutes: int | None


class PrimaryAction(TypedDict):
    key: str
    title: str
    action: str
    reason: str


class ScoreResult(TypedDict):
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
    primary_action: PrimaryAction
    features: dict[str, float | int | str]


def _clamp(value: float, minimum: float = 0, maximum: float = 100) -> float:
    return min(maximum, max(minimum, value))


def _round(value: float) -> int:
    """Match JavaScript Math.round for the non-negative values used by the model."""
    return floor(value + 0.5)


def normalize_usage(usage: dict[str, int] | None) -> dict[str, int]:
    source = usage or {}
    return {category: max(0, _round(float(source.get(category, 0) or 0))) for category in CATEGORIES}


def validate_context(
    usage: dict[str, int] | None,
    *,
    reported_total_minutes: int | None = None,
    late_night_minutes: int = 0,
    deep_work_minutes: int = 0,
) -> ValidationResult:
    normalized = normalize_usage(usage)
    total = sum(normalized.values())
    errors: list[str] = []
    warnings: list[str] = []

    if total <= 0:
        errors.append("Add at least one minute of screen-time usage before saving.")
    if total > 1440:
        errors.append("Category totals cannot exceed 1,440 minutes in one day.")
    if reported_total_minutes is not None and int(reported_total_minutes) != total:
        errors.append(
            f"Category totals add up to {total} minutes, but the reported total is "
            f"{int(reported_total_minutes)} minutes."
        )
    if deep_work_minutes > total and total > 0:
        warnings.append("Deep-work minutes exceed total screen time. Review this optional value.")
    if late_night_minutes > total and total > 0:
        warnings.append("Late-night minutes exceed total screen time. Review this optional value.")

    return {
        "valid": not errors,
        "errors": errors,
        "warnings": warnings,
        "category_total_minutes": total,
        "reported_total_minutes": reported_total_minutes,
    }


def burnout_risk(score: int) -> str:
    if score >= 75:
        return "high"
    if score >= 50:
        return "elevated"
    if score >= 25:
        return "moderate"
    return "low"


def primary_action(
    usage: dict[str, int],
    *,
    total_minutes: int,
    productive_ratio: float,
    dominant_category: str,
    dominant_ratio: float,
    app_switches: int,
    late_night_minutes: int,
    deep_work_minutes: int,
) -> PrimaryAction:
    if late_night_minutes >= 60:
        return {
            "key": "late-night",
            "title": "Create a calmer stopping point tonight",
            "action": "Move 30 minutes of late-night screen use earlier and set a clear stop time.",
            "reason": (
                f"{late_night_minutes} late-night minutes were recorded, the strongest current "
                "fatigue contributor."
            ),
        }
    if deep_work_minutes < 25:
        return {
            "key": "deep-work",
            "title": "Protect one focused block tomorrow",
            "action": (
                "Reserve 25 minutes for learning or priority work before opening entertainment apps."
            ),
            "reason": "No sustained deep-work session was recorded in the latest snapshot.",
        }
    if dominant_category == "social" and dominant_ratio >= 0.4:
        return {
            "key": "social",
            "title": "Give social use a boundary",
            "action": (
                "Choose one planned social window and keep the first 20 minutes of your day app-free."
            ),
            "reason": f"Social represented {_round(dominant_ratio * 100)}% of recorded screen time.",
        }
    if dominant_category in {"games", "entertainment"}:
        return {
            "key": dominant_category,
            "title": "Put one priority before entertainment",
            "action": "Complete one 20-minute priority task before your next entertainment session.",
            "reason": f"{CATEGORY_LABELS[dominant_category]} was the largest recorded usage category.",
        }
    if app_switches >= 50:
        return {
            "key": "switching",
            "title": "Reduce one source of switching",
            "action": "Use focus mode for one 25-minute block and keep only the required app open.",
            "reason": f"{app_switches} app switches were recorded.",
        }
    if usage["productivity"] + usage["learning"] < total_minutes * 0.25:
        return {
            "key": "productive-ratio",
            "title": "Start with one useful task",
            "action": "Use the first 20 minutes tomorrow for work, planning, or learning.",
            "reason": (
                f"Productive activity represented {_round(productive_ratio * 100)}% of recorded "
                "screen time."
            ),
        }
    return {
        "key": "maintain",
        "title": "Keep the pattern easy to repeat",
        "action": "Repeat your strongest focus block at the same time tomorrow.",
        "reason": "The latest snapshot does not show one unusually strong source of friction.",
    }


def calculate_scores(
    usage: dict[str, int] | None,
    *,
    app_switches: int = 0,
    late_night_minutes: int = 0,
    deep_work_minutes: int = 0,
    launch_count: int = 0,
) -> ScoreResult:
    normalized = normalize_usage(usage)
    app_switches = max(0, int(app_switches or 0))
    late_night_minutes = max(0, int(late_night_minutes or 0))
    deep_work_minutes = max(0, int(deep_work_minutes or 0))
    launch_count = max(0, int(launch_count or 0))
    total = sum(normalized.values())
    productive_minutes = normalized["productivity"] + normalized["learning"]
    leisure_minutes = normalized["social"] + normalized["games"] + normalized["entertainment"]
    productive_ratio = productive_minutes / total if total else 0
    leisure_ratio = leisure_minutes / total if total else 0
    social_ratio = normalized["social"] / total if total else 0
    recovery_ratio = normalized["health"] / total if total else 0
    deep_work_ratio = deep_work_minutes / total if total else 0
    late_night_ratio = late_night_minutes / total if total else 0
    dominant = max(normalized, key=lambda category: normalized[category]) if total else "none"
    dominant_ratio = normalized.get(dominant, 0) / total if total else 0
    usage_hours = max(total / 60, 1)
    switch_rate = app_switches / usage_hours

    focus_score = _round(
        _clamp(
            42
            + productive_ratio * 42
            + min(deep_work_minutes, 120) * 0.22
            - leisure_ratio * 27
            - max(app_switches - 20, 0) * 0.16
            - max(late_night_minutes - 20, 0) * 0.11
        )
    )
    fatigue_score = _round(
        _clamp(
            8
            + max(total - 240, 0) * 0.105
            + late_night_minutes * 0.23
            + app_switches * 0.08
            - min(deep_work_minutes, 90) * 0.04
        )
    )
    distraction_score = _round(
        _clamp(
            12
            + leisure_ratio * 43
            + app_switches * 0.24
            + launch_count * 0.08
            - productive_ratio * 18
        )
    )
    burnout_score_value = _round(
        _clamp(
            fatigue_score * 0.48
            + distraction_score * 0.22
            + max(total - 360, 0) * 0.06
            + late_night_minutes * 0.09
            - min(deep_work_minutes, 90) * 0.04
        )
    )
    if total == 0:
        focus_score = 0
        fatigue_score = 0
        distraction_score = 0
        burnout_score_value = 0
    confidence = _round(
        _clamp(
            38
            + (20 if total > 0 else 0)
            + (7 if app_switches > 0 else 0)
            + (7 if deep_work_minutes > 0 else 0)
            + (5 if launch_count > 0 else 0)
            + (5 if late_night_minutes > 0 else 0),
            maximum=92,
        )
    )
    action = primary_action(
        normalized,
        total_minutes=total,
        productive_ratio=productive_ratio,
        dominant_category=dominant,
        dominant_ratio=dominant_ratio,
        app_switches=app_switches,
        late_night_minutes=late_night_minutes,
        deep_work_minutes=deep_work_minutes,
    )
    category_label = CATEGORY_LABELS.get(dominant, "No category")
    insights = [
        (
            f"{category_label} represented {_round(dominant_ratio * 100)}% of recorded screen time."
            if total
            else "No screen-time usage has been recorded for this day."
        ),
        (
            f"{_round(productive_ratio * 100)}% of recorded time supported work or learning."
        ),
        (
            f"{deep_work_minutes} minutes of deeper focus activity were recorded."
            if deep_work_minutes >= 25
            else "No sustained deep-work session was recorded."
        ),
    ]

    return {
        "focus_score": focus_score,
        "fatigue_score": fatigue_score,
        "distraction_score": distraction_score,
        "burnout_score": burnout_score_value,
        "burnout_risk": burnout_risk(burnout_score_value),
        "confidence": confidence / 100,
        "total_minutes": total,
        "productive_ratio": round(productive_ratio, 4),
        "social_ratio": round(social_ratio, 4),
        "recovery_ratio": round(recovery_ratio, 4),
        "deep_work_ratio": round(deep_work_ratio, 4),
        "late_night_ratio": round(late_night_ratio, 4),
        "switch_rate": round(switch_rate, 2),
        "top_category": dominant,
        "usage": normalized,
        "insights": insights,
        "recommendations": [
            action["action"],
            "Keep the next change small enough to repeat tomorrow.",
        ],
        "primary_action": action,
        "features": {
            "total_minutes": total,
            "productive_ratio": round(productive_ratio, 4),
            "social_ratio": round(social_ratio, 4),
            "recovery_ratio": round(recovery_ratio, 4),
            "deep_work_ratio": round(deep_work_ratio, 4),
            "late_night_ratio": round(late_night_ratio, 4),
            "switch_rate": round(switch_rate, 2),
            "top_category": dominant,
        },
    }
