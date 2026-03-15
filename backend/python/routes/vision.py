# Vision API routes for the Slime Companion API
# Handles Gemini-powered image interpretation and slime creation, connecting to Google's Gemini API and Supabase

from fastapi import APIRouter, HTTPException
from python.schemas import VisionInterpretRequest, VisionInterpretResult, InterpretImageResponse, SlimeResponse, PersonalityData
from python.config import Gemini_api_key
from python.db import supabase
from python.utils import infer_personality, get_slime_type
import google.generativeai as genai

router = APIRouter(prefix="", tags=["vision"])

# Configure Gemini API
genai.configure(api_key=Gemini_api_key)
model = genai.GenerativeModel("gemini-2.5-flash")

@router.post("/interpret-image", response_model=InterpretImageResponse)
def interpret_image(payload: VisionInterpretRequest):
    """
    Accepts a base64 image, detects the object class using Gemini,
    and automatically creates a slime for the user if one doesn't exist.
    This route securely calls Gemini from the backend instead of exposing the API key to the frontend.
    """
    try:
        # Detect object using Gemini
        prompt = (
            "Look at this image. Is the main object a FOOD item, a BOOK or a CHAIR? "
            "If it is a food item, reply with only the word 'Food'. "
            "If it is a book, reply with only the word 'Book'. "
            "If it is a chair, reply with only the word 'Fit'. "
            "If it is neither a food book or chair, reply with exactly 'Unknown'. "
            "Reply with ONLY one of these three words: Food, Book, Fit, or Unknown."
        )

        response = model.generate_content([
            prompt,
            {
                "mime_type": payload.mime_type,
                "data": payload.image_base64,
            },
        ])

        text = (response.text or "").strip()

        # Validate response is one of expected values
        if text not in {"Food", "Book", "Fit", "Unknown"}:
            text = "Unknown"

        # If user_id is provided and object is recognized, create a slime
        if payload.user_id and text != "Unknown":
            # Map detected object to object_class for slime creation
            object_class_map = {
                "Food": "food",
                "Book": "book",
                "Fit": "sport"
            }
            object_class = object_class_map.get(text, "other")

            # Check if user already has a slime
            existing_slime = supabase.table("slimes")\
                .select("*")\
                .eq("user_id", payload.user_id)\
                .order("created_at", desc=True)\
                .limit(1)\
                .execute()

            # Only create slime if user doesn't have one
            if not existing_slime.data or len(existing_slime.data) == 0:
                # Infer slime type and personality from object class
                slime_type = get_slime_type(object_class)
                personality = infer_personality(object_class)

                # Create slime in database with default white color
                slime_data = {
                    "user_id": payload.user_id,
                    "slime_type": slime_type,
                    "personality": personality,
                    "bond_level": 0,
                    "state": "idle",
                    "dominant_color": "#FFFFFF"  # Default white color
                }

                result = supabase.table("slimes").insert(slime_data).execute()

                if not result.data or len(result.data) == 0:
                    raise HTTPException(status_code=500, detail="Failed to create slime")

                slime = result.data[0]

                # Create initial journey entry with birth location if coordinates provided
                if payload.latitude is not None and payload.longitude is not None:
                    journey_data = {
                        "slime_id": slime["id"],
                        "start_lat": payload.latitude,
                        "start_lng": payload.longitude,
                        "dest_lat": payload.latitude,  # Initially at birth location
                        "dest_lng": payload.longitude,
                        "progress": 0.0,
                        "status": "idle",  # Not traveling yet
                        "place_name": "Birth Location",
                        "place_reason": "Where the slime was born"
                    }
                    supabase.table("journeys").insert(journey_data).execute()

                # Create birth event
                event_data = {
                    "slime_id": slime["id"],
                    "event_type": "birth",
                    "message": f"A {slime_type} slime was born from a {object_class}!"
                }
                supabase.table("events").insert(event_data).execute()

                return InterpretImageResponse(
                    result=text,
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
            else:
                # User already has a slime, just return detection result with existing slime
                slime = existing_slime.data[0]
                personality = slime["personality"]
                return InterpretImageResponse(
                    result=text,
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

        # If no user_id or Unknown object, just return the detection result
        return InterpretImageResponse(result=text)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")
