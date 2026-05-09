# app/db/models/user.py
# Beanie User document — mirrors the Mongoose User model from Backend/

from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from beanie import Document, Indexed
from pydantic import EmailStr, Field


class UserRole(str, Enum):
    PARENT = "parent"
    CHILD = "child"
    ADMIN = "admin"


class UserDocument(Document):
    """
    User document stored in MongoDB.
    Supports Parent → Child relationship for monitoring.
    """

    email: Optional[EmailStr] = None
    username: Indexed(str, unique=True)  # type: ignore[valid-type]
    password_hash: str  # bcrypt hash — never returned in API responses
    role: UserRole = UserRole.PARENT
    first_name: str
    last_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None

    # Parent-Child relationship
    parent_id: Optional[str] = None       # set for child accounts
    children: list[str] = Field(default_factory=list)  # set for parent accounts

    # Consent & Privacy
    consent_given: bool = False
    consent_date: Optional[datetime] = None
    parental_consent: Optional[bool] = None  # for child accounts

    # Account status
    is_active: bool = True
    is_verified: bool = False
    last_login_at: Optional[datetime] = None

    # Security — refresh tokens stored for rotation/revocation
    refresh_tokens: list[str] = Field(default_factory=list)
    password_changed_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        # Atlas already has the correct indexes from the Mongoose model.
        # Beanie will use the field-level Indexed() annotations and won't
        # try to re-create conflicting ones when allow_index_dropping=False.

    def to_public(self) -> dict:
        """Return safe user dict without sensitive fields."""
        return {
            "id": str(self.id),
            "email": self.email,
            "username": self.username,
            "role": self.role.value,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "parent_id": self.parent_id,
            "children": self.children,
            "created_at": self.created_at.isoformat(),
        }
