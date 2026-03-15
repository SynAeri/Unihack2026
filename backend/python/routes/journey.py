# Journey routes for slime navigation and location tracking
# Handles fetching slime current location from journeys table

from fastapi import APIRouter, HTTPException
from python.db import supabase
from python.schemas import JourneyResponse

router = APIRouter(prefix="/journeys", tags=["journeys"])

@router.get("/slimes/{slime_id}/current", response_model=JourneyResponse)
async def get_slime_current_journey(slime_id: str):
    """
    Get the most recent journey for a slime to determine its current location.
    Returns the latest journey entry which contains the slime's current/destination coordinates.
    """
    result = supabase.table("journeys")\
        .select("*")\
        .eq("slime_id", slime_id)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()

    if not result.data or len(result.data) == 0:
        raise HTTPException(status_code=404, detail="No journey found for this slime")

    journey = result.data[0]

    return JourneyResponse(
        id=journey["id"],
        slime_id=journey["slime_id"],
        start_lat=journey["start_lat"],
        start_lng=journey["start_lng"],
        dest_lat=journey["dest_lat"],
        dest_lng=journey["dest_lng"],
        progress=journey["progress"],
        status=journey["status"],
        place_name=journey.get("place_name", "Unknown"),
        place_reason=journey.get("place_reason", ""),
        created_at=journey["created_at"]
    )
