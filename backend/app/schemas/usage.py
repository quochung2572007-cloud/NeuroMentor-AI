from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models import DevicePlatform, UsageSource


class DeviceCreateRequest(BaseModel):
    platform: DevicePlatform = DevicePlatform.extension
    device_name: str = Field(min_length=1, max_length=128)


class DeviceResponse(BaseModel):
    id: UUID
    platform: DevicePlatform
    device_name: str
    last_sync_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UsagePayload(BaseModel):
    social: int = Field(ge=0, le=1440, default=0)
    productivity: int = Field(ge=0, le=1440, default=0)
    games: int = Field(ge=0, le=1440, default=0)
    learning: int = Field(ge=0, le=1440, default=0)
    health: int = Field(ge=0, le=1440, default=0)
    entertainment: int = Field(ge=0, le=1440, default=0)

    @model_validator(mode="after")
    def validate_daily_total(self) -> "UsagePayload":
        if sum(self.model_dump().values()) > 1440:
            raise ValueError("Category totals cannot exceed 1,440 minutes in one day.")
        return self


class UsageSessionRequest(BaseModel):
    device_id: UUID
    session_date: date | None = None
    source: UsageSource = UsageSource.extension
    usage: UsagePayload


class UsageSessionResponse(BaseModel):
    session_id: UUID
    report_id: UUID
    session_date: date
