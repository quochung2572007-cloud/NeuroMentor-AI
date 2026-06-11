from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field

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
    social: int = Field(ge=0, default=0)
    productivity: int = Field(ge=0, default=0)
    games: int = Field(ge=0, default=0)
    learning: int = Field(ge=0, default=0)
    health: int = Field(ge=0, default=0)
    entertainment: int = Field(ge=0, default=0)


class UsageSessionRequest(BaseModel):
    device_id: UUID
    session_date: date | None = None
    source: UsageSource = UsageSource.extension
    usage: UsagePayload


class UsageSessionResponse(BaseModel):
    session_id: UUID
    report_id: UUID
    session_date: date
