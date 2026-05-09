# app/api/v1/auth.py
# Auth endpoints: register (parent), create-child, login, refresh, logout

from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, field_validator
from app.db.models.user import UserDocument, UserRole
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_refresh_token
from app.core.dependencies import get_current_user
from app.observability.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["Auth"])


# ──────────────────────────────────────────────
# Request / Response Schemas
# ──────────────────────────────────────────────

class RegisterParentRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    first_name: str
    last_name: str
    phone: str | None = None
    consent_given: bool = True

    @field_validator("username")
    @classmethod
    def username_length(cls, v: str) -> str:
        if len(v) < 3 or len(v) > 30:
            raise ValueError("Username must be 3–30 characters")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class CreateChildRequest(BaseModel):
    username: str
    password: str
    first_name: str
    last_name: str


class LoginRequest(BaseModel):
    login: str   # email or username
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


def _token_response(user: UserDocument) -> dict:
    access = create_access_token(str(user.id), user.role.value)
    refresh = create_refresh_token(str(user.id), user.role.value)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "expires_in": 15 * 60,
        "user": user.to_public(),
    }


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_parent(body: RegisterParentRequest):
    """Register a new parent account."""
    # Email uniqueness
    existing = await UserDocument.find_one(UserDocument.email == body.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Username uniqueness
    existing_u = await UserDocument.find_one(UserDocument.username == body.username)
    if existing_u:
        raise HTTPException(status_code=409, detail="Username already taken")

    user = UserDocument(
        email=body.email,
        username=body.username,
        password_hash=hash_password(body.password),
        role=UserRole.PARENT,
        first_name=body.first_name,
        last_name=body.last_name,
        phone=body.phone,
        consent_given=body.consent_given,
        consent_date=datetime.utcnow() if body.consent_given else None,
    )
    await user.insert()

    resp = _token_response(user)
    # Save refresh token
    user.refresh_tokens.append(resp["refresh_token"])
    await user.save()

    logger.info("parent_registered", user_id=str(user.id))
    return {"success": True, **resp}


@router.post("/create-child", status_code=status.HTTP_201_CREATED)
async def create_child(
    body: CreateChildRequest,
    current_user: UserDocument = Depends(get_current_user),
):
    """Parent creates a child account linked to their account."""
    if current_user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Only parents can create child accounts")

    existing_u = await UserDocument.find_one(UserDocument.username == body.username)
    if existing_u:
        raise HTTPException(status_code=409, detail="Username already taken")

    child = UserDocument(
        username=body.username,
        password_hash=hash_password(body.password),
        role=UserRole.CHILD,
        first_name=body.first_name,
        last_name=body.last_name,
        parent_id=str(current_user.id),
        parental_consent=True,
        consent_given=True,
    )
    await child.insert()

    # Link child to parent
    current_user.children.append(str(child.id))
    await current_user.save()

    logger.info("child_created", child_id=str(child.id), parent_id=str(current_user.id))
    return {"success": True, "user": child.to_public()}


@router.post("/login")
async def login(body: LoginRequest):
    """Login with email or username + password."""
    login_val = body.login.strip().lower()

    # Try email first, then username
    if "@" in login_val:
        user = await UserDocument.find_one(UserDocument.email == login_val)
    else:
        user = await UserDocument.find_one(UserDocument.username == login_val)

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    resp = _token_response(user)
    user.refresh_tokens.append(resp["refresh_token"])
    user.last_login_at = datetime.utcnow()
    await user.save()

    logger.info("user_logged_in", user_id=str(user.id))
    return {"success": True, **resp}


@router.post("/refresh")
async def refresh_token(body: RefreshRequest):
    """Exchange a valid refresh token for a new token pair."""
    payload = decode_refresh_token(body.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = await UserDocument.get(payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")

    if body.refresh_token not in user.refresh_tokens:
        raise HTTPException(status_code=401, detail="Refresh token revoked")

    # Rotate: remove old, add new
    user.refresh_tokens.remove(body.refresh_token)
    resp = _token_response(user)
    user.refresh_tokens.append(resp["refresh_token"])
    await user.save()

    return {"success": True, **resp}


@router.post("/logout")
async def logout(
    body: RefreshRequest | None = None,
    current_user: UserDocument = Depends(get_current_user),
):
    """Revoke refresh token(s). Omit body to logout all devices."""
    if body and body.refresh_token in current_user.refresh_tokens:
        current_user.refresh_tokens.remove(body.refresh_token)
    else:
        current_user.refresh_tokens.clear()
    await current_user.save()
    return {"success": True, "message": "Logged out"}


@router.get("/me")
async def get_me(current_user: UserDocument = Depends(get_current_user)):
    """Return current authenticated user's profile."""
    return {"success": True, "user": current_user.to_public()}
