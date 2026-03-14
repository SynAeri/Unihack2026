import requests

endpoint_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

locationcoord = "placeholder"
radius = 500 # Placeholder
keyword = "Placeholder"
API_Key = "Placeholder"

params = {
    "location": locationcoord,
    "radius": radius,
    "keyword": keyword,
    "key": API_Key
}

response = requests.get(endpoint_url, params=params)
#print(response)
print()
for location in response["results"]:
    print(f"name: {location["name"]}, location :{location["geometry"]["location"]}")