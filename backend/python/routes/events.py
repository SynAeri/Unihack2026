# Event routes for the Slime Companion API
# Handles event history and creation, connecting to Supabase events table

from fastapi import APIRouter, HTTPException
from typing import List
from python.db import supabase
from python.schemas import EventResponse, CreateEventRequest

router = APIRouter(prefix="/events", tags=["events"])

@router.get("/slimes/{slime_id}/events", response_model=List[EventResponse])
async def get_slime_events(slime_id: str):
    # Get event history for a slime.
    # Returns events in chronological order (oldest first).
    result = supabase.table("events")\
        .select("*")\
        .eq("slime_id", slime_id)\
        .order("created_at", desc=False)\
        .execute()

    if not result.data:
        return []

    events = [
        EventResponse(
            id=event["id"],
            slime_id=event["slime_id"],
            event_type=event["event_type"],
            message=event["message"],
            created_at=event["created_at"]
        )
        for event in result.data
    ]

    return events

@router.post("/create", response_model=EventResponse)
async def create_event(request: CreateEventRequest):
    # Create arbitrary event manually.
    # For testing and unique int. stuff

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
