# Debug routes for the Slime Companion API
# Provides testing helpers for hackathon/demo, connecting to Supabase for quick state manipulation

from fastapi import APIRouter, HTTPException
from python.db import supabase
from python.schemas import (
    DebugSeedSlimeRequest,
    DebugSetStateRequest,
    SlimeResponse,
    CreateEventRequest,
    EventResponse
)
from python.utils import infer_personality, get_slime_type

router = APIRouter(prefix="/debug", tags=["debug"])

@router.post("/seed-slime", response_model=SlimeResponse)
async def seed_slime(request: DebugSeedSlimeRequest):
    # Create a slime without scan flow.
    # Useful for testing when AR/scan is broken.
    slime_type = get_slime_type(request.object_class)
    personality = infer_personality(request.object_class)

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
        "message": f"Debug: A {slime_type} slime was created!"
    }
    supabase.table("events").insert(event_data).execute()

    return SlimeResponse(
        id=slime["id"],
        user_id=slime["user_id"],
        slime_type=slime["slime_type"],
        personality=slime["personality"],
        bond_level=slime["bond_level"],
        state=slime["state"],
        dominant_color=slime["dominant_color"],
        created_at=slime["created_at"]
    )

@router.post("/set-state")
async def debug_set_state(request: DebugSetStateRequest):
    # Force a slime into a specific state.
    # Bypasses normal state transition logic.
    
    valid_states = ["idle", "exploring", "hungry", "curious", "resting"]

    if request.state not in valid_states:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state. Must be one of: {', '.join(valid_states)}"
        )

    result = supabase.table("slimes")\
        .update({"state": request.state})\
        .eq("id", request.slime_id)\
        .execute()

    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="Slime not found")

    # Create debug event
    event_data = {
        "slime_id": request.slime_id,
        "event_type": "debug",
        "message": f"Debug: State forced to {request.state}"
    }
    supabase.table("events").insert(event_data).execute()

    return {"message": f"Debug: Slime state set to {request.state}", "state": request.state}


# That event walk thing where it finds an interesting thing.

@router.post("/create-event", response_model=EventResponse)
async def debug_create_event(request: CreateEventRequest):
    # Manually create an event to test event feed.
    # Same as /events/create but in debug namespace.

    event_data = {
        "slime_id": request.slime_id,
        "event_type": request.event_type,
        "message": request.message
    }

    result = supabase.table("events").insert(event_data).execute()

    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=500, detail="Failed to create event")

    event = result.data[0]

    return EventResponse(
        id=event["id"],
        slime_id=event["slime_id"],
        event_type=event["event_type"],
        message=event["message"],
        created_at=event["created_at"]
    )
