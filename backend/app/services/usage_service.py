from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from app.models import (
    CoachingMessage,
    CoachingMessageType,
    DailyReport,
    Device,
    FeatureSnapshot,
    UsageCategory,
    UsageCategoryLog,
    UsageSession,
    User,
)
from app.services.report_engine import ReportResult, analyze_usage
from app.services.scoring import CATEGORIES


def _usage_dict_from_logs(logs: list[UsageCategoryLog]) -> dict[str, int]:
    usage = {cat: 0 for cat in CATEGORIES}
    for log in logs:
        usage[log.category.value] = log.minutes
    return usage


def _persist_coaching_messages(db: Session, report: DailyReport, result: ReportResult) -> None:
    db.query(CoachingMessage).filter(CoachingMessage.report_id == report.id).delete()

    priority = 0
    for text in result.warnings:
        db.add(
            CoachingMessage(
                report_id=report.id,
                message_type=CoachingMessageType.warning,
                text=text,
                priority=priority,
            )
        )
        priority += 1
    for text in result.suggestions:
        db.add(
            CoachingMessage(
                report_id=report.id,
                message_type=CoachingMessageType.suggestion,
                text=text,
                priority=priority,
            )
        )
        priority += 1
    for text in result.notes:
        db.add(
            CoachingMessage(
                report_id=report.id,
                message_type=CoachingMessageType.note,
                text=text,
                priority=priority,
            )
        )
        priority += 1


def upsert_usage_session(
    db: Session,
    user: User,
    device: Device,
    session_date: date,
    source,
    usage_payload: dict[str, int],
) -> tuple[UsageSession, DailyReport]:
    session = (
        db.query(UsageSession)
        .filter(
            UsageSession.user_id == user.id,
            UsageSession.device_id == device.id,
            UsageSession.session_date == session_date,
        )
        .one_or_none()
    )

    if session is None:
        session = UsageSession(
            user_id=user.id,
            device_id=device.id,
            session_date=session_date,
            source=source,
        )
        db.add(session)
        db.flush()
    else:
        session.source = source
        db.query(UsageCategoryLog).filter(UsageCategoryLog.session_id == session.id).delete()

    for category in CATEGORIES:
        db.add(
            UsageCategoryLog(
                session_id=session.id,
                category=UsageCategory(category),
                minutes=usage_payload[category],
            )
        )

    device.last_sync_at = datetime.now(timezone.utc)

    result = analyze_usage(usage_payload)
    report = _upsert_daily_report(db, user, session_date, result)
    _upsert_feature_snapshot(db, user, session_date, result)

    db.commit()
    db.refresh(session)
    db.refresh(report)
    return session, report


def _upsert_daily_report(db: Session, user: User, report_date: date, result: ReportResult) -> DailyReport:
    report = (
        db.query(DailyReport)
        .filter(DailyReport.user_id == user.id, DailyReport.report_date == report_date)
        .one_or_none()
    )

    if report is None:
        report = DailyReport(user_id=user.id, report_date=report_date)
        db.add(report)
        db.flush()
    else:
        _persist_coaching_messages(db, report, result)
        report.brain_score = result.brain_score
        report.time_level = result.time_level
        report.brain_level = result.brain_level
        report.intensity = result.intensity
        report.total_minutes = result.total_minutes
        db.flush()
        return report

    report.brain_score = result.brain_score
    report.time_level = result.time_level
    report.brain_level = result.brain_level
    report.intensity = result.intensity
    report.total_minutes = result.total_minutes
    _persist_coaching_messages(db, report, result)
    return report


def _upsert_feature_snapshot(db: Session, user: User, feature_date: date, result: ReportResult) -> None:
    snapshot = (
        db.query(FeatureSnapshot)
        .filter(FeatureSnapshot.user_id == user.id, FeatureSnapshot.feature_date == feature_date)
        .one_or_none()
    )
    if snapshot is None:
        snapshot = FeatureSnapshot(user_id=user.id, feature_date=feature_date, vector=result.features)
        db.add(snapshot)
    else:
        snapshot.vector = result.features


def report_to_response(report: DailyReport, usage: dict[str, int] | None = None) -> dict:
    messages = sorted(report.coaching_messages, key=lambda m: m.priority)
    warnings = [m.text for m in messages if m.message_type == CoachingMessageType.warning]
    suggestions = [m.text for m in messages if m.message_type == CoachingMessageType.suggestion]
    notes = [m.text for m in messages if m.message_type == CoachingMessageType.note]

    return {
        "id": report.id,
        "report_date": report.report_date,
        "brain_score": report.brain_score,
        "time_level": report.time_level,
        "brain_level": report.brain_level,
        "intensity": report.intensity,
        "total_minutes": report.total_minutes,
        "model_version": report.model_version,
        "usage": usage or {},
        "warnings": warnings,
        "suggestions": suggestions,
        "notes": notes,
        "messages": messages,
        "created_at": report.created_at,
    }


def get_usage_for_date(db: Session, user: User, report_date: date) -> dict[str, int]:
    sessions = (
        db.query(UsageSession)
        .filter(UsageSession.user_id == user.id, UsageSession.session_date == report_date)
        .all()
    )
    aggregated = {cat: 0 for cat in CATEGORIES}
    for session in sessions:
        for log in session.category_logs:
            aggregated[log.category.value] += log.minutes
    return aggregated
