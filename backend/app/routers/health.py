from fastapi import APIRouter
from fastapi.responses import RedirectResponse

from app.config import settings
from app.services.email_reminders import email_delivery_configured

router = APIRouter(tags=["health"])


@router.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse(url=settings.app_public_url)


@router.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "neurommentor-api",
        "email_delivery_configured": email_delivery_configured(),
    }
