# Location search module connecting to Google Places API and SerpAPI
# Two-tier search: 1) radius-based keyword search, 2) fallback to comprehensive review search

import requests
import random
import sys
from pathlib import Path
from serpapi import GoogleSearch

backend_path = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(backend_path))

from config import Google_api, Serp_api


class LocationSearch:

    NEARBY_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

    def __init__(self, location_coord, radius_multiplier, keyword, deep_search=False):
        self.location_coord = location_coord
        self.radius = 500 * radius_multiplier
        self.keyword = keyword
        self.deep_search = deep_search
        self.google_api_key = Google_api
        self.serp_api_key = Serp_api if deep_search else None

    def search_nearby_with_keyword(self):
        params = {
            "location": self.location_coord,
            "radius": self.radius,
            "keyword": self.keyword,
            "key": self.google_api_key
        }

        try:
            response = requests.get(self.NEARBY_SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()

            if data.get("status") == "OK" and len(data.get("results", [])) > 0:
                results = data["results"]
                random_location = results[random.randint(0, len(results) - 1)]
                geometry = random_location.get("geometry", {})
                location = geometry.get("location", {})
                return {
                    "name": random_location.get("name"),
                    "address": random_location.get("vicinity"),
                    "place_id": random_location.get("place_id"),
                    "rating": random_location.get("rating"),
                    "location": location,
                    "gps": {"latitude": location.get("lat"), "longitude": location.get("lng")},
                    "search_type": "nearby_keyword"
                }

            return None

        except requests.RequestException as e:
            print(f"Error in nearby search: {e}")
            return None

    def get_all_nearby_places(self):
        params = {
            "location": self.location_coord,
            "radius": self.radius,
            "key": self.google_api_key
        }

        try:
            response = requests.get(self.NEARBY_SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()

            if data.get("status") == "OK":
                return data.get("results", [])

            return []

        except requests.RequestException as e:
            print(f"Error getting nearby places: {e}")
            return []

    def search_reviews_with_serpapi(self, place_name, location):
        lat = location.get("lat")
        lng = location.get("lng")
        search_query = f"{place_name} @{lat},{lng}"

        params = {
            "engine": "google_maps",
            "q": search_query,
            "type": "search",
            "api_key": self.serp_api_key
        }

        try:
            search = GoogleSearch(params)
            results = search.get_dict()

            local_results = results.get("local_results", [])
            if not local_results:
                return None

            place_result = local_results[0]
            place_id = place_result.get("place_id")

            if not place_id:
                return None

            reviews_params = {
                "engine": "google_maps_reviews",
                "place_id": place_id,
                "api_key": self.serp_api_key
            }

            reviews_search = GoogleSearch(reviews_params)
            reviews_data = reviews_search.get_dict()

            reviews = reviews_data.get("reviews", [])
            matching_reviews = []
            for review in reviews:
                review_text = review.get("snippet", "")
                if self.keyword.lower() in review_text.lower():
                    matching_reviews.append({
                        "text": review.get("snippet"),
                        "rating": review.get("rating"),
                        "date": review.get("date")
                    })

            if matching_reviews:
                return {
                    "place_name": place_result.get("title"),
                    "address": place_result.get("address"),
                    "rating": place_result.get("rating"),
                    "place_id": place_id,
                    "gps": place_result.get("gps_coordinates"),
                    "matching_reviews": matching_reviews,
                    "total_reviews": reviews_data.get("serpapi_pagination", {}).get("total_reviews")
                }

            return None

        except Exception as e:
            print(f"Error in SerpAPI review search for {place_name}: {e}")
            return None

    def search_all_reviews_for_keyword(self):
        print(f"Searching all reviews for keyword '{self.keyword}'...")

        nearby_places = self.get_all_nearby_places()

        if not nearby_places:
            print("No nearby places found")
            return None

        print(f"Found {len(nearby_places)} nearby places, searching reviews...")

        for place in nearby_places:
            place_name = place.get("name")
            location = place.get("geometry", {}).get("location")

            if not place_name or not location:
                continue

            print(f"Checking reviews for: {place_name}")

            review_match = self.search_reviews_with_serpapi(place_name, location)

            if review_match:
                return {
                    "name": review_match["place_name"],
                    "address": review_match["address"],
                    "place_id": review_match["place_id"],
                    "rating": review_match["rating"],
                    "gps": review_match["gps"],
                    "search_type": "review_keyword_serpapi",
                    "matching_reviews": review_match["matching_reviews"],
                    "total_reviews": review_match["total_reviews"]
                }

        return None

    def search(self):
        if self.deep_search:
            if not self.serp_api_key:
                return {
                    "error": "Deep search requested but Serp_api key not configured",
                    "search_type": "none"
                }

            print(f"Deep search enabled: Skipping nearby search, going straight to review search...")
            print(f"Searching reviews with SerpAPI for '{self.keyword}'...")
            result = self.search_all_reviews_for_keyword()

            if result:
                print(f"Found via deep review search: {result['name']} at {result['address']}")
                print(f"GPS: {result['gps']}")
                print(f"Rating: {result.get('rating', 'N/A')}")
                print(f"Total reviews: {result.get('total_reviews', 'N/A')}")
                print(f"Matching reviews containing '{self.keyword}':")
                for i, review in enumerate(result.get('matching_reviews', []), 1):
                    print(f"\n[{i}] Rating: {review.get('rating')} | Date: {review.get('date')}")
                    print(f"    {review.get('text')}")
                return result

            print(f"No location with '{self.keyword}' found in reviews")
            return {
                "error": f"No location with '{self.keyword}' found in reviews",
                "search_type": "none"
            }

        print(f"Tier 1: Searching nearby places for '{self.keyword}'...")
        result = self.search_nearby_with_keyword()

        if result:
            print(f"Found via nearby search: {result['name']} at {result['address']}")
            print(f"GPS: {result['gps']}")
            print(f"Rating: {result.get('rating', 'N/A')}")
            return result

        print(f"No nearby places with '{self.keyword}' found")

        if not self.serp_api_key:
            print(f"No SerpAPI key configured, cannot search reviews")
            return {
                "error": f"No location with '{self.keyword}' found",
                "search_type": "none"
            }

        print(f"Tier 2: Searching reviews with SerpAPI...")
        result = self.search_all_reviews_for_keyword()

        if result:
            print(f"Found via review search: {result['name']} at {result['address']}")
            print(f"GPS: {result['gps']}")
            print(f"Rating: {result.get('rating', 'N/A')}")
            print(f"Total reviews: {result.get('total_reviews', 'N/A')}")
            print(f"Matching reviews containing '{self.keyword}':")
            for i, review in enumerate(result.get('matching_reviews', []), 1):
                print(f"\n[{i}] Rating: {review.get('rating')} | Date: {review.get('date')}")
                print(f"    {review.get('text')}")
            return result

        print(f"No location with '{self.keyword}' found in area")
        return {
            "error": f"No location with '{self.keyword}' found",
            "search_type": "none"
        }


if __name__ == "__main__":
    slimeloc = "-33.8670522,151.1957362"
    slimebond = 2
    keyword = "food"
    deep_search = True

    searcher = LocationSearch(slimeloc, slimebond, keyword, deep_search=deep_search)
    result = searcher.search()

    if "error" not in result:
        print(f"\n{'='*50}")
        print(f"FINAL RESULT:")
        print(f"{'='*50}")
        print(f"Name: {result['name']}")
        print(f"Address: {result['address']}")
        print(f"GPS: {result.get('gps', 'N/A')}")
        print(f"Rating: {result.get('rating', 'N/A')}")
        print(f"Search type: {result['search_type']}")

        if result.get('matching_reviews'):
            print(f"\nAll matching reviews containing '{keyword}':")
            for i, review in enumerate(result['matching_reviews'], 1):
                print(f"\n[{i}] Rating: {review.get('rating')} | Date: {review.get('date')}")
                print(f"    {review.get('text')}")
    else:
        print(f"\n{'='*50}")
        print(f"NO RESULTS FOUND")
        print(f"{'='*50}")
