# Utility functions for slime personality, event generation, and validation
# Connects object classes to slime personalities and handles game logic

import random
from typing import Dict, List, Tuple

def infer_personality(object_class: str) -> Dict:
    """
    Map object class to slime personality traits.
    Returns personality dict with temperament, interest, and preferred places.
    """
    personality_map = {
        "book": {
            "temperament": "quiet",
            "interest": "study",
            "preferred_places": ["library", "quiet cafe", "bookstore"]
        },
        "food": {
            "temperament": "social",
            "interest": "snacks",
            "preferred_places": ["cafe", "restaurant", "dessert shop"]
        },
        "sport": {
            "temperament": "energetic",
            "interest": "exercise",
            "preferred_places": ["gym", "park", "sports center"]
        },
        "other": {
            "temperament": "curious",
            "interest": "exploration",
            "preferred_places": ["park", "plaza", "general area"]
        }
    }

    return personality_map.get(object_class.lower(), personality_map["other"])

def get_slime_type(object_class: str) -> str:
    
    # Convert object class to slime type name.
    
    type_map = {
        "book": "scholar",
        "food": "glutton",
        "sport": "athlete",
        "other": "wanderer"
    }

    return type_map.get(object_class.lower(), "wanderer")

def generate_random_event(slime_type: str, personality: Dict) -> Tuple[str, str]:
    
    # Generate a random event for a slime based on its personality.
    # Returns (event_type, message) tuple.
    
    temperament = personality.get("temperament", "curious")

    events_by_temperament = {
        "quiet": [
            ("sidetrack", "Got distracted reading a nearby sign."),
            ("curiosity", "Stopped to observe a quiet bird."),
            ("rest", "Found a peaceful spot and paused to rest.")
        ],
        "social": [
            ("sidetrack", "Got distracted by the smell of fresh bread."),
            ("curiosity", "Noticed a busy cafe and wants to explore."),
            ("hunger", "Getting hungry from all the food smells!")
        ],
        "energetic": [
            ("sidetrack", "Got excited and took a small detour."),
            ("curiosity", "Spotted someone jogging and wants to follow!"),
            ("energy", "Bouncing with energy!")
        ],
        "curious": [
            ("sidetrack", "Found something shiny and stopped to investigate."),
            ("curiosity", "Wondering what's around the corner..."),
            ("exploration", "Loving this adventure!")
        ]
    }

    events = events_by_temperament.get(temperament, events_by_temperament["curious"])
    event_type, message = random.choice(events)

    return event_type, message

def validate_food(food_class: str, labels: List[str], slime_type: str) -> Tuple[bool, str]:
    
    # Validate if the scanned food is acceptable for the slime.
    # Returns (is_valid, message) tuple.
    
    # All slimes accept food and drink
    acceptable_classes = ["food", "drink", "snack", "beverage"]

    # Check if food_class is acceptable
    if food_class.lower() in acceptable_classes:
        # Scholar slimes prefer coffee/tea
        if slime_type == "scholar":
            if any(label.lower() in ["coffee", "tea", "book"] for label in labels):
                return True, "The slime happily consumed it while studying!"
            else:
                return True, "The slime ate it, though it would prefer coffee or tea."

        # Glutton slimes love all food
        elif slime_type == "glutton":
            return True, "The slime devoured it with joy!"

        # Athlete slimes prefer healthy food
        elif slime_type == "athlete":
            if any(label.lower() in ["fruit", "vegetable", "water", "healthy"] for label in labels):
                return True, "The slime gratefully ate the healthy snack!"
            else:
                return True, "The slime ate it, but prefers healthier options."

        # Wanderer slimes accept everything
        else:
            return True, "The slime happily ate it."

    # Not food
    return False, "That's not food! The slime looked confused."

def get_place_category(slime_type: str, personality: Dict) -> str:
    
    # Map slime type to preferred place category for Google Places API.
    
    preferred_places = personality.get("preferred_places", [])

    if slime_type == "scholar":
        return random.choice(["library", "book_store", "cafe"])
    elif slime_type == "glutton":
        return random.choice(["restaurant", "cafe", "bakery"])
    elif slime_type == "athlete":
        return random.choice(["gym", "park", "stadium"])
    else:
        return random.choice(["park", "tourist_attraction", "point_of_interest"])


###############
# PLACEHOLDER 
###############

# Placeholder for now in case we need testing for fake destintation return data
def generate_fake_destination(current_lat: float, current_lng: float, slime_type: str, personality: Dict) -> Dict:
    
    # Generate a fake nearby destination for testing.
    # Later this will be replaced with Google Places API.
    
    # Small random offset (roughly 500m-2km)
    lat_offset = random.uniform(-0.01, 0.01)
    lng_offset = random.uniform(-0.01, 0.01)

    dest_lat = current_lat + lat_offset
    dest_lng = current_lng + lng_offset

    preferred_places = personality.get("preferred_places", ["park"])
    place_type = random.choice(preferred_places)

    place_names = {
        "library": "Central Library",
        "quiet cafe": "Quiet Corner Cafe",
        "bookstore": "Book Haven",
        "cafe": "Sunny Side Cafe",
        "restaurant": "The Cozy Bistro",
        "dessert shop": "Sweet Treats",
        "gym": "FitLife Gym",
        "park": "Green Park",
        "sports center": "Active Sports Complex"
    }

    place_name = place_names.get(place_type, f"Nearby {place_type}")

    return {
        "name": place_name,
        "lat": dest_lat,
        "lng": dest_lng,
        "reason": f"A nice {place_type} that matches your slime's personality"
    }
