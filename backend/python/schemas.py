# Pydantic schemas for request/response models
# Defines the data structures for the Slime Companion API

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Auth schemas
class LoginRequest(BaseModel):
    username: str

class UserResponse(BaseModel):
    id: str
    username: str
    created_at: str

# Slime schemas
class PersonalityData(BaseModel):
    temperament: str
    interest: str
    preferred_places: List[str]

class InterpretImageRequest(BaseModel):
    user_id: str
    object_class: str
    dominant_color: str
    labels: List[str]

class SlimeResponse(BaseModel):
    id: str
    user_id: str
    slime_type: str
    personality: dict
    bond_level: int
    state: str
    dominant_color: str
    created_at: str

class InterpretImageResponse(BaseModel):
    slime: SlimeResponse
    personality: PersonalityData

class SetStateRequest(BaseModel):
    state: str

# Journey schemas
class StartJourneyRequest(BaseModel):
    user_id: str
    current_lat: float
    current_lng: float

class DestinationData(BaseModel):
    name: str
    lat: float
    lng: float
    reason: str

class JourneyResponse(BaseModel):
    id: str
    slime_id: str
    start_lat: float
    start_lng: float
    dest_lat: float
    dest_lng: float
    progress: float
    status: str
    place_name: str
    place_reason: str
    created_at: str

class StartJourneyResponse(BaseModel):
    journey: JourneyResponse
    destination: DestinationData

class JourneyProgressRequest(BaseModel):
    progress: float

# Event schemas
class EventResponse(BaseModel):
    id: str
    slime_id: str
    event_type: str
    message: str
    created_at: str

class CreateEventRequest(BaseModel):
    slime_id: str
    event_type: str
    message: str

# Interaction schemas
class FeedSlimeRequest(BaseModel):
    food_class: str
    labels: List[str]

class FeedSlimeResponse(BaseModel):
    success: bool
    bond_delta: int
    bond_level: int
    message: str

# Debug schemas
class DebugSeedSlimeRequest(BaseModel):
    user_id: str
    object_class: Optional[str] = "book"
    dominant_color: Optional[str] = "#6A7BA2"

class DebugSetStateRequest(BaseModel):
    slime_id: str
    state: str

# Bucket Schema

class SlimeAssets(BaseModel):
    id: str
    user_id: str
    asset_type: str
    asset_role: str 
    bucket_name: str 
    storage_path: str 
    name: str
    is_active: bool

    
