# app/core/security.py
# Password hashing (argon2-cffi) + JWT creation/verification (python-jose)

from datetime import datetime, timedelta, timezone
from typing import Optional
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from jose import JWTError, jwt
from app.config import get_settings

settings = get_settings()

# ──────────────────────────────────────────────
# Password hashing — Argon2id (modern, OWASP recommended)
# ──────────────────────────────────────────────

_ph = PasswordHasher()


def hash_password(plain: str) -> str:
    return _ph.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, plain)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


# ──────────────────────────────────────────────
# JWT — HS256 access + refresh tokens
# ──────────────────────────────────────────────

ALGORITHM = "HS256"


def _create_token(data: dict, secret: str, expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(payload, secret, algorithm=ALGORITHM)


def create_access_token(user_id: str, role: str) -> str:
    return _create_token(
        {"sub": user_id, "role": role, "type": "access"},
        settings.jwt_access_secret,
        timedelta(minutes=settings.jwt_access_expires_minutes),
    )


def create_refresh_token(user_id: str, role: str) -> str:
    return _create_token(
        {"sub": user_id, "role": role, "type": "refresh"},
        settings.jwt_refresh_secret,
        timedelta(days=settings.jwt_refresh_expires_days),
    )


def decode_access_token(token: str) -> Optional[dict]:
    """Returns payload dict or None on failure."""
    try:
        payload = jwt.decode(token, settings.jwt_access_secret, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def decode_refresh_token(token: str) -> Optional[dict]:
    """Returns payload dict or None on failure."""
    try:
        payload = jwt.decode(token, settings.jwt_refresh_secret, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None
