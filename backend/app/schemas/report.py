from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models import CoachingMessageType


class CoachingMessageResponse(BaseModel):
    id: UUID
    message_type: CoachingMessageType
    text: str
    priority: int
    model_version: str

    model_config = {"from_attributes": True}


class DailyReportResponse(BaseModel):
    id: UUID
    report_date: date
    brain_score: int
    time_level: str
    brain_level: str
    intensity: float
    total_minutes: int
    model_version: str
    usage: dict[str, int]
    warnings: list[str]
    suggestions: list[str]
    notes: list[str]
    messages: list[CoachingMessageResponse]
    created_at: datetime


class FeedbackRequest(BaseModel):
    rating: int = Field(ge=-1, le=1)
