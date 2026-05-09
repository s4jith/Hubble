# app/api/v1/users.py
# User profile and parent-child management endpoints

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from app.core.dependencies import get_current_user
from app.db.models.user import UserDocument, UserRole

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_profile(user: UserDocument = Depends(get_current_user)):
    return {"success": True, "user": user.to_public()}


class UpdateProfileRequest(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None


@router.patch("/me")
async def update_profile(
    body: UpdateProfileRequest,
    user: UserDocument = Depends(get_current_user),
):
    if body.first_name:
        user.first_name = body.first_name
    if body.last_name:
        user.last_name = body.last_name
    if body.phone is not None:
        user.phone = body.phone
    await user.save()
    return {"success": True, "user": user.to_public()}


@router.get("/children")
async def list_children(user: UserDocument = Depends(get_current_user)):
    """Parent: list all linked child accounts."""
    if user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Only parents can list children")
    children = await UserDocument.find(
        UserDocument.parent_id == str(user.id)
    ).to_list()
    return {"success": True, "children": [c.to_public() for c in children]}


@router.get("/children/{child_id}")
async def get_child(
    child_id: str,
    user: UserDocument = Depends(get_current_user),
):
    """Parent: get a specific child's profile."""
    if user.role != UserRole.PARENT:
        raise HTTPException(status_code=403, detail="Only parents can view child profiles")
    child = await UserDocument.get(child_id)
    if not child or child.parent_id != str(user.id):
        raise HTTPException(status_code=404, detail="Child not found")
    return {"success": True, "child": child.to_public()}
