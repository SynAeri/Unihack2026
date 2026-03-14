# Vision API routes for the Slime Companion API
# Handles Gemini-powered image interpretation, connecting to Google's Gemini API

from fastapi import APIRouter, HTTPException
from python.schemas import VisionInterpretRequest, VisionInterpretResult
from python.config import Gemini_api_key
import google.generativeai as genai

router = APIRouter(prefix="", tags=["vision"])

# Configure Gemini API
genai.configure(api_key=Gemini_api_key)
model = genai.GenerativeModel("gemini-2.5-flash")

@router.post("/interpret-image", response_model=VisionInterpretResult)
def interpret_image(payload: VisionInterpretRequest):
    """
    Accepts a base64 image and returns whether it's Food, Book, or Unknown.
    This route securely calls Gemini from the backend instead of exposing the API key to the frontend.
    """
    try:
        prompt = (
            "Look at this image. Is the main object a FOOD item or a BOOK? "
            "If it is a food item, reply with only the word 'Food'. "
            "If it is a book, reply with only the word 'Book'. "
            "If it is neither a food nor a book, reply with exactly 'Unknown'. "
            "Reply with ONLY one of these three words: Food, Book, or Unknown."
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
        if text not in {"Food", "Book", "Unknown"}:
            text = "Unknown"

        return VisionInterpretResult(result=text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")
