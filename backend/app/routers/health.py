from fastapi import APIRouter

from app.services.email_reminders import email_delivery_configured

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "neurommentor-api",
        "email_delivery_configured": email_delivery_configured(),
    }
