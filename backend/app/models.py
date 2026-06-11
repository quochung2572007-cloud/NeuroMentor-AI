import enum
import uuid
from datetime import date, datetime, time

from sqlalchemy import (
    Date,
    DateTime,
    Boolean,
    Enum,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    Time,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB as PG_JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

UUID = Uuid
JSON_DOCUMENT = JSON().with_variant(PG_JSONB(), "postgresql")


class UsageCategory(str, enum.Enum):
    social = "social"
    productivity = "productivity"
    games = "games"
    learning = "learning"
    health = "health"
    entertainment = "entertainment"


class DevicePlatform(str, enum.Enum):
    extension = "extension"
    mobile = "mobile"
    web = "web"


class UsageSource(str, enum.Enum):
    manual = "manual"
    extension = "extension"
    mobile = "mobile"
    import_ = "import"


class CoachingMessageType(str, enum.Enum):
    suggestion = "suggestion"
    warning = "warning"
    note = "note"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    profile: Mapped["UserProfile | None"] = relationship(back_populates="user", uselist=False)
    devices: Mapped[list["Device"]] = relationship(back_populates="user")
    usage_sessions: Mapped[list["UsageSession"]] = relationship(back_populates="user")
    daily_reports: Mapped[list["DailyReport"]] = relationship(back_populates="user")
    feature_snapshots: Mapped[list["FeatureSnapshot"]] = relationship(back_populates="user")
    feedback_events: Mapped[list["FeedbackEvent"]] = relationship(back_populates="user")
    email_reminder: Mapped["EmailReminderPreference | None"] = relationship(
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    daily_limit_min: Mapped[int] = mapped_column(Integer, nullable=False, default=240)
    focus_goal_pct: Mapped[int] = mapped_column(Integer, nullable=False, default=45)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="profile")


class EmailReminderPreference(Base):
    __tablename__ = "email_reminder_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reminder_time: Mapped[time] = mapped_column(Time, nullable=False, default=lambda: time(20, 0))
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    last_processed_date: Mapped[date | None] = mapped_column(Date)
    last_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="email_reminder")


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    platform: Mapped[DevicePlatform] = mapped_column(Enum(DevicePlatform, name="device_platform"), nullable=False)
    device_name: Mapped[str] = mapped_column(String(128), nullable=False)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="devices")
    usage_sessions: Mapped[list["UsageSession"]] = relationship(back_populates="device")


class UsageSession(Base):
    __tablename__ = "usage_sessions"
    __table_args__ = (UniqueConstraint("user_id", "device_id", "session_date", name="uq_usage_session_day"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    device_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"))
    session_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    source: Mapped[UsageSource] = mapped_column(Enum(UsageSource, name="usage_source"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="usage_sessions")
    device: Mapped["Device"] = relationship(back_populates="usage_sessions")
    category_logs: Mapped[list["UsageCategoryLog"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class UsageCategoryLog(Base):
    __tablename__ = "usage_category_logs"
    __table_args__ = (UniqueConstraint("session_id", "category", name="uq_category_log"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("usage_sessions.id", ondelete="CASCADE")
    )
    category: Mapped[UsageCategory] = mapped_column(Enum(UsageCategory, name="usage_category"), nullable=False)
    minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    session: Mapped["UsageSession"] = relationship(back_populates="category_logs")


class DailyReport(Base):
    __tablename__ = "daily_reports"
    __table_args__ = (UniqueConstraint("user_id", "report_date", name="uq_daily_report"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    report_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    brain_score: Mapped[int] = mapped_column(Integer, nullable=False)
    time_level: Mapped[str] = mapped_column(String(32), nullable=False)
    brain_level: Mapped[str] = mapped_column(String(32), nullable=False)
    intensity: Mapped[float] = mapped_column(nullable=False)
    total_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False, default="rules-v1")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="daily_reports")
    coaching_messages: Mapped[list["CoachingMessage"]] = relationship(
        back_populates="report", cascade="all, delete-orphan"
    )


class CoachingMessage(Base):
    __tablename__ = "coaching_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("daily_reports.id", ondelete="CASCADE"))
    message_type: Mapped[CoachingMessageType] = mapped_column(
        Enum(CoachingMessageType, name="coaching_message_type"), nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False, default="rules-v1")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    report: Mapped["DailyReport"] = relationship(back_populates="coaching_messages")
    feedback_events: Mapped[list["FeedbackEvent"]] = relationship(back_populates="message")


class FeatureSnapshot(Base):
    __tablename__ = "feature_snapshots"
    __table_args__ = (UniqueConstraint("user_id", "feature_date", name="uq_feature_snapshot"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    feature_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    vector: Mapped[dict] = mapped_column(JSON_DOCUMENT, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="feature_snapshots")


class MlModelVersion(Base):
    __tablename__ = "ml_model_versions"

    version: Mapped[str] = mapped_column(String(64), primary_key=True)
    artifact_uri: Mapped[str] = mapped_column(String(512), nullable=False)
    metrics: Mapped[dict] = mapped_column(JSON_DOCUMENT, nullable=False, default=dict)
    deployed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FeedbackEvent(Base):
    __tablename__ = "feedback_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("coaching_messages.id", ondelete="CASCADE")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    message: Mapped["CoachingMessage"] = relationship(back_populates="feedback_events")
    user: Mapped["User"] = relationship(back_populates="feedback_events")
