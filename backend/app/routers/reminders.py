from datetime import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import EmailReminderPreference, User
from app.schemas.reminder import (
    ReminderPreferenceResponse,
    ReminderPreferenceUpdate,
    ReminderTestResponse,
)
from app.services.email_reminders import (
    email_delivery_configured,
    send_reminder_email,
    validate_timezone,
)

router = APIRouter(prefix="/reminders", tags=["reminders"])


def _get_or_create_preference(db: Session, user: User) -> EmailReminderPreference:
    preference = db.get(EmailReminderPreference, user.id)
    if preference is not None:
        return preference

    timezone_name = user.profile.timezone if user.profile else "UTC"
    preference = EmailReminderPreference(
        user_id=user.id,
        enabled=False,
        reminder_time=time(20, 0),
        timezone=timezone_name,
    )
    db.add(preference)
    db.commit()
    db.refresh(preference)
    return preference


def _response(preference: EmailReminderPreference, user: User) -> ReminderPreferenceResponse:
    return ReminderPreferenceResponse(
        enabled=preference.enabled,
        reminder_time=preference.reminder_time,
        timezone=preference.timezone,
        delivery_configured=email_delivery_configured(),
        destination_email=user.email,
        last_sent_at=preference.last_sent_at,
    )


@router.get("/me", response_model=ReminderPreferenceResponse)
def get_reminder_preference(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReminderPreferenceResponse:
    return _response(_get_or_create_preference(db, user), user)


@router.put("/me", response_model=ReminderPreferenceResponse)
def update_reminder_preference(
    body: ReminderPreferenceUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReminderPreferenceResponse:
    try:
        timezone_name = validate_timezone(body.timezone)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    if body.enabled and not email_delivery_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The production email provider is not configured",
        )

    preference = _get_or_create_preference(db, user)
    changed_schedule = (
        preference.reminder_time != body.reminder_time
        or preference.timezone != timezone_name
        or preference.enabled != body.enabled
    )
    preference.enabled = body.enabled
    preference.reminder_time = body.reminder_time
    preference.timezone = timezone_name
    if changed_schedule:
        preference.last_processed_date = None
    if user.profile:
        user.profile.timezone = timezone_name
    db.commit()
    db.refresh(preference)
    return _response(preference, user)


@router.post("/test", response_model=ReminderTestResponse)
def send_test_reminder(user: User = Depends(get_current_user)) -> ReminderTestResponse:
    if not email_delivery_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The production email provider is not configured",
        )
    try:
        send_reminder_email(user.email, is_test=True)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The email provider rejected the test message",
        ) from exc

    return ReminderTestResponse(
        sent=True,
        destination_email=user.email,
        message="Test email sent",
    )
