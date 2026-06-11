from datetime import datetime, timedelta, timezone
from hashlib import sha256
from uuid import UUID

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

bearer_scheme = HTTPBearer(auto_error=False)
PASSWORD_SCHEME_PREFIX = "nm2$"


def hash_password(password: str) -> str:
    digest = sha256(password.encode("utf-8")).digest()
    hashed = bcrypt.hashpw(digest, bcrypt.gensalt()).decode("ascii")
    return f"{PASSWORD_SCHEME_PREFIX}{hashed}"


def verify_password(plain: str, hashed: str) -> bool:
    try:
        if hashed.startswith(PASSWORD_SCHEME_PREFIX):
            digest = sha256(plain.encode("utf-8")).digest()
            stored = hashed.removeprefix(PASSWORD_SCHEME_PREFIX).encode("ascii")
            return bcrypt.checkpw(digest, stored)

        # Compatibility with accounts created by the original passlib bcrypt setup.
        plain_bytes = plain.encode("utf-8")
        if len(plain_bytes) > 72:
            return False
        return bcrypt.checkpw(plain_bytes, hashed.encode("ascii"))
    except (TypeError, ValueError):
        return False


def create_access_token(user_id: UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    try:
        parsed_user_id = UUID(user_id)
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    user = db.get(User, parsed_user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
