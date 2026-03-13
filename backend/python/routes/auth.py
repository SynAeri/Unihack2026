# Authentication routes for the Slime Companion API
# Handles mock username-based login, connecting to Supabase users table

from fastapi import APIRouter, HTTPException
from python.db import supabase
from python.schemas import LoginRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=UserResponse)
async def login(request: LoginRequest):
    """
    Mock login using username only.
    Creates user if not exists, returns user if exists.
    """
    username = request.username.strip()

    if not username:
        raise HTTPException(status_code=400, detail="Username cannot be empty")

    # Check if user exists
    result = supabase.table("users").select("*").eq("username", username).execute()

    if result.data and len(result.data) > 0:
        # User exists, return it
        user = result.data[0]
        return UserResponse(
            id=user["id"],
            username=user["username"],
            created_at=user["created_at"]
        )

    # User doesn't exist, create new user
    new_user_result = supabase.table("users").insert({
        "username": username
    }).execute()

    if not new_user_result.data or len(new_user_result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create user")

    user = new_user_result.data[0]

    return UserResponse(
        id=user["id"],
        username=user["username"],
        created_at=user["created_at"]
    )
