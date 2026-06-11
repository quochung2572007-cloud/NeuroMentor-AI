from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import CoachingMessage, DailyReport, FeedbackEvent, User
from app.schemas.report import DailyReportResponse, FeedbackRequest
from app.services.usage_service import get_usage_for_date, report_to_response

router = APIRouter(prefix="/reports", tags=["reports"])


def _load_report(db: Session, user: User, report_date: date) -> DailyReport | None:
    return (
        db.query(DailyReport)
        .options(joinedload(DailyReport.coaching_messages))
        .filter(DailyReport.user_id == user.id, DailyReport.report_date == report_date)
        .one_or_none()
    )


@router.get("/today", response_model=DailyReportResponse)
def get_today_report(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    report_date = date.today()
    report = _load_report(db, user, report_date)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    usage = get_usage_for_date(db, user, report_date)
    return report_to_response(report, usage)


@router.get("/{report_date}", response_model=DailyReportResponse)
def get_report_for_date(
    report_date: date,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    report = _load_report(db, user, report_date)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    usage = get_usage_for_date(db, user, report_date)
    return report_to_response(report, usage)


@router.get("", response_model=list[DailyReportResponse])
def list_reports(
    days: int = 7,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[dict]:
    if days < 1 or days > 90:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="days must be between 1 and 90")

    start = date.today() - timedelta(days=days - 1)
    reports = (
        db.query(DailyReport)
        .options(joinedload(DailyReport.coaching_messages))
        .filter(DailyReport.user_id == user.id, DailyReport.report_date >= start)
        .order_by(DailyReport.report_date.desc())
        .all()
    )

    return [report_to_response(report, get_usage_for_date(db, user, report.report_date)) for report in reports]


@router.post("/messages/{message_id}/feedback", status_code=status.HTTP_201_CREATED)
def submit_feedback(
    message_id: UUID,
    body: FeedbackRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    message = (
        db.query(CoachingMessage)
        .join(DailyReport)
        .filter(CoachingMessage.id == message_id, DailyReport.user_id == user.id)
        .one_or_none()
    )
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    event = FeedbackEvent(message_id=message.id, user_id=user.id, rating=body.rating)
    db.add(event)
    db.commit()
    return {"status": "recorded", "message_id": str(message_id), "rating": body.rating}
