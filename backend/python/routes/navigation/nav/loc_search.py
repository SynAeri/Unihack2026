import requests

endpoint_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

locationcoord = "-33.8670522,151.1957362"
radius = 1500 # Placeholder
keyword = "restaurant"
API_Key = "AIzaSyBkCPN6Fa7qDphn2oteJrY-wXC66_4arpM" #placeholder

params = {
    "location": locationcoord,
    "radius": radius,
    "keyword": keyword,
    "key": API_Key
}

response = requests.get(endpoint_url, params=params)
data = response.json()
print(data)

#for location in data["results"]:
    #print(f"name: {location["name"]}, location :{location["geometry"]["location"]}")