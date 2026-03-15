# Interaction routes for the Slime Companion API
# Handles feeding, personality fusion, and other slime interactions, connecting to Supabase slimes and events tables

from fastapi import APIRouter, HTTPException
from python.db import supabase
from python.schemas import FeedSlimeRequest, FeedSlimeResponse, FusePersonalityRequest, FusePersonalityResponse, PersonalityData
from python.utils import validate_food, fuse_personalities

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

@router.post("/slimes/{slime_id}/fuse-personality", response_model=FusePersonalityResponse)
async def fuse_slime_personality(slime_id: str, request: FusePersonalityRequest):
    """
    Fuse slime's existing personality with a new object class.
    Creates hybrid personality traits that combine both influences.

    Example: A food slime (glutton) that absorbs a book becomes interested in
    "matcha and study snacks" with preferred places like "study cafe" and "matcha bar".
    """
    # Validate slime_id matches request
    if slime_id != request.slime_id:
        raise HTTPException(status_code=400, detail="Slime ID mismatch")

    # Get slime data
    slime_result = supabase.table("slimes")\
        .select("*")\
        .eq("id", slime_id)\
        .execute()

    if not slime_result.data or len(slime_result.data) == 0:
        raise HTTPException(status_code=404, detail="Slime not found")

    slime = slime_result.data[0]
    existing_personality = slime.get("personality", {})

    # Validate new_object_class
    valid_classes = ["book", "food", "sport", "other"]
    if request.new_object_class.lower() not in valid_classes:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid object class. Must be one of: {valid_classes}"
        )

    # Fuse personalities
    fused_personality = fuse_personalities(existing_personality, request.new_object_class)

    # Update slime with new fused personality
    update_result = supabase.table("slimes")\
        .update({"personality": fused_personality})\
        .eq("id", slime_id)\
        .execute()

    if not update_result.data or len(update_result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to update slime personality")

    # Create fusion event
    event_data = {
        "slime_id": slime_id,
        "event_type": "personality_fusion",
        "message": f"Absorbed {request.new_object_class}! Now interested in {fused_personality['interest']}"
    }
    supabase.table("events").insert(event_data).execute()

    return FusePersonalityResponse(
        success=True,
        fused_personality=PersonalityData(
            temperament=fused_personality["temperament"],
            interest=fused_personality["interest"],
            preferred_places=fused_personality["preferred_places"]
        ),
        message=f"Your slime's personality evolved! It now has a {fused_personality['temperament']} temperament and is interested in {fused_personality['interest']}."
    )
