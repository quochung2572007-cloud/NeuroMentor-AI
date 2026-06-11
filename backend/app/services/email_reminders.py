import asyncio
import json
import logging
import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.database import SessionLocal
from app.models import EmailReminderPreference, UsageSession

logger = logging.getLogger(__name__)


def email_delivery_configured() -> bool:
    resend_configured = bool(settings.resend_api_key and settings.email_from)
    smtp_configured = bool(
        settings.smtp_host
        and settings.smtp_port
        and settings.smtp_username
        and settings.smtp_password
        and (settings.smtp_from_email or settings.smtp_username)
    )
    return resend_configured or smtp_configured


def validate_timezone(timezone_name: str) -> str:
    try:
        ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError as exc:
        raise ValueError("Unknown timezone") from exc
    return timezone_name


def _message_content(is_test: bool = False) -> tuple[str, str, str]:
    subject = (
        "Your NeuroMentor test email"
        if is_test
        else "A quick reminder to add today's Screen Time"
    )

    if is_test:
        text = (
            "Your daily NeuroMentor email reminder is connected.\n\n"
            "When a reminder is due, NeuroMentor will skip it if today's Screen Time "
            "has already been uploaded."
        )
        heading = "Your daily reminder is ready."
        detail = "This test confirms that NeuroMentor can reach your inbox."
    else:
        text = (
            "You have not added today's Screen Time yet.\n\n"
            f"Open NeuroMentor: {settings.app_public_url}\n\n"
            "A small daily check-in helps your focus and fatigue trends stay useful."
        )
        heading = "Before the day gets away from you..."
        detail = "Add today's Screen Time to keep your attention baseline current."

    html = f"""
        <!doctype html>
        <html>
          <body style="margin:0;background:#f4f0e7;color:#173139;font-family:Arial,sans-serif">
            <div style="max-width:560px;margin:0 auto;padding:36px 20px">
              <div style="background:#fffdf7;border:1px solid #d9d5c9;border-radius:24px;padding:32px">
                <p style="margin:0 0 12px;color:#397e70;font-size:12px;font-weight:700;letter-spacing:1.4px">
                  NEUROMENTOR AI
                </p>
                <h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:30px">{heading}</h1>
                <p style="margin:0 0 24px;line-height:1.6;color:#40575d">{detail}</p>
                <a href="{settings.app_public_url}"
                   style="display:inline-block;padding:13px 20px;border-radius:12px;background:#173139;
                          color:#fffdf7;text-decoration:none;font-weight:700">
                  Open NeuroMentor
                </a>
                <p style="margin:24px 0 0;color:#718084;font-size:12px;line-height:1.5">
                  You can change or disable this reminder from your NeuroMentor account panel.
                </p>
              </div>
            </div>
          </body>
        </html>
        """
    return subject, text, html


def _send_with_resend(destination: str, is_test: bool) -> None:
    subject, text, html = _message_content(is_test)
    payload = json.dumps(
        {
            "from": settings.email_from,
            "to": [destination],
            "subject": subject,
            "text": text,
            "html": html,
        }
    ).encode("utf-8")
    request = Request(
        "https://api.resend.com/emails",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
            "User-Agent": "NeuroMentor/1.0",
        },
    )
    try:
        with urlopen(request, timeout=20) as response:
            if response.status >= 300:
                raise RuntimeError(f"Resend returned HTTP {response.status}")
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Resend rejected the email: {detail}") from exc
    except URLError as exc:
        raise RuntimeError("Could not reach Resend") from exc


def _send_with_smtp(destination: str, is_test: bool) -> None:
    subject, text, html = _message_content(is_test)
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = (
        f"{settings.smtp_from_name} <{settings.smtp_from_email or settings.smtp_username}>"
    )
    message["To"] = destination
    message.set_content(text)
    message.add_alternative(html, subtype="html")

    smtp_class = smtplib.SMTP_SSL if settings.smtp_use_ssl else smtplib.SMTP
    with smtp_class(settings.smtp_host, settings.smtp_port, timeout=20) as smtp:
        if settings.smtp_starttls and not settings.smtp_use_ssl:
            smtp.starttls()
        smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)


def _build_message(destination: str, is_test: bool = False) -> EmailMessage:
    """Build an SMTP message for compatibility and focused unit tests."""
    subject, text, html = _message_content(is_test)
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = (
        settings.email_from
        or f"{settings.smtp_from_name} <{settings.smtp_from_email or settings.smtp_username}>"
    )
    message["To"] = destination
    message.set_content(text)
    message.add_alternative(html, subtype="html")
    return message


def send_reminder_email(destination: str, is_test: bool = False) -> None:
    if not email_delivery_configured():
        raise RuntimeError("Email delivery is not configured")
    if settings.resend_api_key and settings.email_from:
        _send_with_resend(destination, is_test)
        return
    _send_with_smtp(destination, is_test)


def _process_preference(db: Session, preference: EmailReminderPreference, now_utc: datetime) -> None:
    try:
        local_now = now_utc.astimezone(ZoneInfo(preference.timezone))
    except ZoneInfoNotFoundError:
        logger.warning("Skipping reminder with invalid timezone for user %s", preference.user_id)
        return

    local_date = local_now.date()
    if preference.last_processed_date == local_date:
        return
    if local_now.time().replace(tzinfo=None) < preference.reminder_time:
        return

    uploaded_today = (
        db.query(UsageSession.id)
        .filter(
            UsageSession.user_id == preference.user_id,
            UsageSession.session_date == local_date,
        )
        .first()
        is not None
    )
    if uploaded_today:
        preference.last_processed_date = local_date
        db.commit()
        return

    send_reminder_email(preference.user.email)
    preference.last_processed_date = local_date
    preference.last_sent_at = now_utc
    db.commit()


def process_due_email_reminders() -> int:
    if not email_delivery_configured():
        return 0

    now_utc = datetime.now(timezone.utc)
    sent_count = 0
    db = SessionLocal()
    try:
        preferences = (
            db.query(EmailReminderPreference)
            .options(joinedload(EmailReminderPreference.user))
            .filter(EmailReminderPreference.enabled.is_(True))
            .all()
        )
        for preference in preferences:
            previous_sent_at = preference.last_sent_at
            try:
                _process_preference(db, preference, now_utc)
                if preference.last_sent_at != previous_sent_at:
                    sent_count += 1
            except Exception:
                db.rollback()
                logger.exception("Could not process email reminder for user %s", preference.user_id)
    finally:
        db.close()
    return sent_count


async def run_email_reminder_scheduler(stop_event: asyncio.Event) -> None:
    logger.info("Email reminder scheduler started")
    while not stop_event.is_set():
        try:
            await asyncio.to_thread(process_due_email_reminders)
        except Exception:
            logger.exception("Email reminder scheduler iteration failed")

        try:
            await asyncio.wait_for(
                stop_event.wait(),
                timeout=max(settings.email_reminder_poll_seconds, 15),
            )
        except TimeoutError:
            continue
    logger.info("Email reminder scheduler stopped")
