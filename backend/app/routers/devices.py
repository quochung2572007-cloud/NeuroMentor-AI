from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import Device, User
from app.schemas.usage import DeviceCreateRequest, DeviceResponse

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def register_device(
    body: DeviceCreateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Device:
    device = Device(user_id=user.id, platform=body.platform, device_name=body.device_name)
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.get("", response_model=list[DeviceResponse])
def list_devices(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Device]:
    return db.query(Device).filter(Device.user_id == user.id).order_by(Device.created_at.desc()).all()


@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(
    device_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Device:
    device = db.query(Device).filter(Device.id == device_id, Device.user_id == user.id).one_or_none()
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    return device
