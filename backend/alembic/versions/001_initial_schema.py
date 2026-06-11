"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-10

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")

    device_platform = postgresql.ENUM("extension", "mobile", "web", name="device_platform", create_type=False)
    usage_source = postgresql.ENUM("manual", "extension", "mobile", "import", name="usage_source", create_type=False)
    usage_category = postgresql.ENUM(
        "social",
        "productivity",
        "games",
        "learning",
        "health",
        "entertainment",
        name="usage_category",
        create_type=False,
    )
    coaching_message_type = postgresql.ENUM(
        "suggestion", "warning", "note", name="coaching_message_type", create_type=False
    )

    device_platform.create(op.get_bind(), checkfirst=True)
    usage_source.create(op.get_bind(), checkfirst=True)
    usage_category.create(op.get_bind(), checkfirst=True)
    coaching_message_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "user_profiles",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("daily_limit_min", sa.Integer(), nullable=False, server_default="240"),
        sa.Column("focus_goal_pct", sa.Integer(), nullable=False, server_default="45"),
        sa.Column("timezone", sa.String(64), nullable=False, server_default="UTC"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "devices",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("platform", device_platform, nullable=False),
        sa.Column("device_name", sa.String(128), nullable=False),
        sa.Column("last_sync_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "usage_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("device_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("devices.id", ondelete="CASCADE"), nullable=False),
        sa.Column("session_date", sa.Date(), nullable=False),
        sa.Column("source", usage_source, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("user_id", "device_id", "session_date", name="uq_usage_session_day"),
    )
    op.create_index("ix_usage_sessions_session_date", "usage_sessions", ["session_date"])

    op.create_table(
        "usage_category_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("usage_sessions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", usage_category, nullable=False),
        sa.Column("minutes", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint("session_id", "category", name="uq_category_log"),
    )

    op.create_table(
        "daily_reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("report_date", sa.Date(), nullable=False),
        sa.Column("brain_score", sa.Integer(), nullable=False),
        sa.Column("time_level", sa.String(32), nullable=False),
        sa.Column("brain_level", sa.String(32), nullable=False),
        sa.Column("intensity", sa.Float(), nullable=False),
        sa.Column("total_minutes", sa.Integer(), nullable=False),
        sa.Column("model_version", sa.String(64), nullable=False, server_default="rules-v1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("user_id", "report_date", name="uq_daily_report"),
    )
    op.create_index("ix_daily_reports_report_date", "daily_reports", ["report_date"])

    op.create_table(
        "coaching_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("report_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("daily_reports.id", ondelete="CASCADE"), nullable=False),
        sa.Column("message_type", coaching_message_type, nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("priority", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("model_version", sa.String(64), nullable=False, server_default="rules-v1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "feature_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("feature_date", sa.Date(), nullable=False),
        sa.Column("vector", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("user_id", "feature_date", name="uq_feature_snapshot"),
    )
    op.create_index("ix_feature_snapshots_feature_date", "feature_snapshots", ["feature_date"])

    op.create_table(
        "ml_model_versions",
        sa.Column("version", sa.String(64), primary_key=True),
        sa.Column("artifact_uri", sa.String(512), nullable=False),
        sa.Column("metrics", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("deployed_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "feedback_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("message_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("coaching_messages.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("feedback_events")
    op.drop_table("ml_model_versions")
    op.drop_index("ix_feature_snapshots_feature_date", table_name="feature_snapshots")
    op.drop_table("feature_snapshots")
    op.drop_table("coaching_messages")
    op.drop_index("ix_daily_reports_report_date", table_name="daily_reports")
    op.drop_table("daily_reports")
    op.drop_table("usage_category_logs")
    op.drop_index("ix_usage_sessions_session_date", table_name="usage_sessions")
    op.drop_table("usage_sessions")
    op.drop_table("devices")
    op.drop_table("user_profiles")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS coaching_message_type")
    op.execute("DROP TYPE IF EXISTS usage_category")
    op.execute("DROP TYPE IF EXISTS usage_source")
    op.execute("DROP TYPE IF EXISTS device_platform")
