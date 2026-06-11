from pydantic import BaseModel, Field

from app.schemas.usage import UsagePayload


class CognitiveContext(BaseModel):
    usage: UsagePayload
    app_switches: int = Field(default=0, ge=0, le=10000)
    late_night_minutes: int = Field(default=0, ge=0, le=1440)
    deep_work_minutes: int = Field(default=0, ge=0, le=1440)
    launch_count: int = Field(default=0, ge=0, le=10000)


class AlertResponse(BaseModel):
    alert_type: str
    severity: str
    title: str
    message: str
    reason: str
    action: str


class CognitivePredictionResponse(BaseModel):
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
    alerts: list[AlertResponse]
    features: dict[str, float | int | str]
    model_version: str


class MentorRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1000)
    context: CognitiveContext


class MentorResponse(BaseModel):
    answer: str
    evidence: list[str]
    next_steps: list[str]
    disclaimer: str
