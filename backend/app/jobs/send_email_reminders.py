from app.services.email_reminders import process_due_email_reminders


def main() -> None:
    sent_count = process_due_email_reminders()
    print(f"Processed email reminders; sent={sent_count}")


if __name__ == "__main__":
    main()

