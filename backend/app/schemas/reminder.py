from datetime import datetime, time

from pydantic import BaseModel, Field


class ReminderPreferenceUpdate(BaseModel):
    enabled: bool
    reminder_time: time
    timezone: str = Field(min_length=1, max_length=64)


class ReminderPreferenceResponse(BaseModel):
    enabled: bool
    reminder_time: time
    timezone: str
    delivery_configured: bool
    destination_email: str
    last_sent_at: datetime | None


class ReminderTestResponse(BaseModel):
    sent: bool
    destination_email: str
    message: str
