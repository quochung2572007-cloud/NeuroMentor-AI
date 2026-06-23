import json
import tempfile
import unittest
from datetime import datetime, time, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base
from app.models import (
    Device,
    DevicePlatform,
    EmailReminderPreference,
    UsageSession,
    UsageSource,
    User,
)
from app.services.email_reminders import _process_preference, send_reminder_email


class EmailReminderSchedulerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        database_path = Path(self.temp_dir.name) / "test.db"
        self.engine = create_engine(
            f"sqlite:///{database_path}",
            connect_args={"check_same_thread": False},
        )

        @event.listens_for(self.engine, "connect")
        def enable_foreign_keys(dbapi_connection, _connection_record) -> None:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self.sessions: list[Session] = []

    def tearDown(self) -> None:
        for session in self.sessions:
            session.close()
        self.engine.dispose()
        self.temp_dir.cleanup()

    def _create_user_and_preference(self):
        db = self.Session()
        self.sessions.append(db)
        user = User(email="daily@example.com", password_hash="unused")
        db.add(user)
        db.flush()
        preference = EmailReminderPreference(
            user_id=user.id,
            enabled=True,
            reminder_time=time(0, 0),
            timezone="UTC",
        )
        db.add(preference)
        db.commit()
        db.refresh(user)
        db.refresh(preference)
        return db, user, preference

    def test_sends_once_when_usage_is_missing(self) -> None:
        db, user, preference = self._create_user_and_preference()
        now = datetime(2026, 6, 11, 12, 0, tzinfo=timezone.utc)

        with patch("app.services.email_reminders.send_reminder_email") as send_email:
            _process_preference(db, preference, now)
            _process_preference(db, preference, now)

        send_email.assert_called_once_with(user.email)
        self.assertEqual(preference.last_processed_date, now.date())
        self.assertEqual(preference.last_sent_at.replace(tzinfo=timezone.utc), now)

    def test_skips_email_when_usage_exists_for_local_day(self) -> None:
        db, user, preference = self._create_user_and_preference()
        now = datetime(2026, 6, 11, 12, 0, tzinfo=timezone.utc)
        device = Device(
            user_id=user.id,
            platform=DevicePlatform.web,
            device_name="Web browser",
        )
        db.add(device)
        db.flush()
        db.add(
            UsageSession(
                user_id=user.id,
                device_id=device.id,
                session_date=now.date(),
                source=UsageSource.manual,
            )
        )
        db.commit()

        with patch("app.services.email_reminders.send_reminder_email") as send_email:
            _process_preference(db, preference, now)

        send_email.assert_not_called()
        self.assertEqual(preference.last_processed_date, now.date())
        self.assertIsNone(preference.last_sent_at)

    @patch("app.services.email_reminders.urlopen")
    def test_resend_delivery_uses_login_email_as_recipient(self, urlopen: MagicMock) -> None:
        response = MagicMock()
        response.status = 200
        urlopen.return_value.__enter__.return_value = response

        with (
            patch("app.services.email_reminders.settings.resend_api_key", "re_test_key"),
            patch(
                "app.services.email_reminders.settings.email_from",
                "NeuroMentor AI <reminders@example.com>",
            ),
        ):
            send_reminder_email("user@example.com", is_test=True)

        request = urlopen.call_args.args[0]
        payload = json.loads(request.data.decode("utf-8"))
        self.assertEqual(request.full_url, "https://api.resend.com/emails")
        self.assertEqual(payload["to"], ["user@example.com"])
        self.assertEqual(payload["from"], "NeuroMentor AI <reminders@example.com>")


if __name__ == "__main__":
    unittest.main()
