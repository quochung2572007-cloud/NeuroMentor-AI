from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Device, User
from app.schemas.usage import UsageSessionRequest, UsageSessionResponse
from app.services.usage_service import upsert_usage_session

router = APIRouter(prefix="/usage", tags=["usage"])


@router.post("/sessions", response_model=UsageSessionResponse, status_code=status.HTTP_201_CREATED)
def create_usage_session(
    body: UsageSessionRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UsageSessionResponse:
    device = db.query(Device).filter(Device.id == body.device_id, Device.user_id == user.id).one_or_none()
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    session_date = body.session_date or date.today()
    usage = body.usage.model_dump()

    session, report = upsert_usage_session(db, user, device, session_date, body.source, usage)
    return UsageSessionResponse(session_id=session.id, report_id=report.id, session_date=session_date)
