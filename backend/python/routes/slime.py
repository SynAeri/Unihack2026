# Slime management routes for the Slime Companion API
# Handles slime creation from scans, state updates, and retrieval, connecting to Supabase slimes table

from fastapi import APIRouter, HTTPException
from python.db import supabase
from python.schemas import (
    InterpretImageRequest,
    InterpretImageResponse,
    SlimeResponse,
    PersonalityData,
    SetStateRequest
)
from python.utils import infer_personality, get_slime_type

router = APIRouter(prefix="/slimes", tags=["slimes"])

@router.get("/users/{user_id}/slime", response_model=SlimeResponse)
async def get_user_slime(user_id: str):
    # Fetch the most recent or active slime for a user.

    # Get most recent slime for this user
    result = supabase.table("slimes")\
        .select("*")\
        .eq("user_id", user_id)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()

    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="No slime found for this user")

    slime = result.data[0]

    return SlimeResponse(
        id=slime["id"],
        user_id=slime["user_id"],
        slime_type=slime["slime_type"],
        personality=slime["personality"],
        bond_level=slime["bond_level"],
        state=slime["state"],
        dominant_color=slime["dominant_color"],
        size=slime["size"],
        created_at=slime["created_at"]
    )

@router.post("/interpret-image", response_model=InterpretImageResponse)
async def interpret_image(request: InterpretImageRequest):
    # Create a slime from interpreted scan data.
    # Maps object class to slime type and personality, stores in DB.
    
    # Infer slime type and personality from object class
    slime_type = get_slime_type(request.object_class)
    personality = infer_personality(request.object_class)

    # Create slime in database
    slime_data = {
        "user_id": request.user_id,
        "slime_type": slime_type,
        "personality": personality,
        "bond_level": 0,
        "state": "idle",
        "dominant_color": request.dominant_color
    }

    result = supabase.table("slimes").insert(slime_data).execute()

    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create slime")

    slime = result.data[0]

    # Create birth event
    event_data = {
        "slime_id": slime["id"],
        "event_type": "birth",
        "message": f"A {slime_type} slime was born from a {request.object_class}!"
    }

    supabase.table("events").insert(event_data).execute()

    return InterpretImageResponse(
        slime=SlimeResponse(
            id=slime["id"],
            user_id=slime["user_id"],
            slime_type=slime["slime_type"],
            personality=slime["personality"],
            bond_level=slime["bond_level"],
            state=slime["state"],
            dominant_color=slime["dominant_color"],
            size=slime["size"],
            created_at=slime["created_at"]
        ),
        personality=PersonalityData(
            temperament=personality["temperament"],
            interest=personality["interest"],
            preferred_places=personality["preferred_places"]
        )
    )

@router.post("/{slime_id}/state")
async def update_slime_state(slime_id: str, request: SetStateRequest):
    # Update slime state.
    # Accepted states: idle, exploring, hungry, curious, resting
    
    valid_states = ["idle", "exploring", "hungry", "curious", "resting"]

    if request.state not in valid_states:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state. Must be one of: {', '.join(valid_states)}"
        )

    # Update slime state
    result = supabase.table("slimes")\
        .update({"state": request.state})\
        .eq("id", slime_id)\
        .execute()

    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Slime not found")

    return {"message": f"Slime state updated to {request.state}", "state": request.state}
