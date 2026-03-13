# Interaction routes for the Slime Companion API
# Handles feeding and other slime interactions, connecting to Supabase slimes and events tables

from fastapi import APIRouter, HTTPException
from python.db import supabase
from python.schemas import FeedSlimeRequest, FeedSlimeResponse
from python.utils import validate_food

router = APIRouter(prefix="/interaction", tags=["interaction"])

@router.post("/slimes/{slime_id}/feed", response_model=FeedSlimeResponse)
async def feed_slime(slime_id: str, request: FeedSlimeRequest):
    # Feed slime based on scan result.
    # Validates food, updates bond level, creates event.

    # Get slime data
    slime_result = supabase.table("slimes")\
        .select("*")\
        .eq("id", slime_id)\
        .execute()

    if not slime_result.data or len(slime_result.data) == 0:
        raise HTTPException(status_code=404, detail="Slime not found")

    slime = slime_result.data[0]
    slime_type = slime["slime_type"]
    current_bond = slime["bond_level"]

    # Validate food
    is_valid, message = validate_food(request.food_class, request.labels, slime_type)

    if not is_valid:
        # Create failed feed event
        event_data = {
            "slime_id": slime_id,
            "event_type": "feed_failed",
            "message": message
        }
        supabase.table("events").insert(event_data).execute()

        return FeedSlimeResponse(
            success=False,
            bond_delta=0,
            bond_level=current_bond,
            message=message
        )

    # Food is valid, increment bond
    bond_delta = 1
    new_bond = current_bond + bond_delta

    # Update slime bond level and set state to idle (no longer hungry)
    update_result = supabase.table("slimes")\
        .update({"bond_level": new_bond, "state": "idle"})\
        .eq("id", slime_id)\
        .execute()

    if not update_result.data or len(update_result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to update slime")

    # Create positive feed event
    event_data = {
        "slime_id": slime_id,
        "event_type": "fed",
        "message": message
    }
    supabase.table("events").insert(event_data).execute()

    return FeedSlimeResponse(
        success=True,
        bond_delta=bond_delta,
        bond_level=new_bond,
        message=message
    )
