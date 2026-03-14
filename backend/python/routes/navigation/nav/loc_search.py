import requests
import random

endpoint_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

#put post endpoint here
slimeloc = "-33.8670522,151.1957362" #placeholder, user data is supposed to be here
slimebond =  2 #placeholder , user data is supposed to be here

locationcoord = slimeloc
radius = 500 *slimebond 
keyword = "restaurant" #placeholder
API_Key = "AIzaSyBZ38KmbsMg2jNhKywyw8Yo84sWw8xrmm4" 

params = {
    "location": locationcoord,
    "radius": radius,
    "keyword": keyword,
    "key": API_Key
}

response = requests.get(endpoint_url, params=params)
data = response.json()


#for location in data["results"]:
    #print(f"name: {location["name"]}, location :{location["geometry"]["location"]}")
#len(data["results"])

randlocation = data["results"][random.randint(0, int(len(data["results"])) - 1)]
print(f"name: {randlocation["name"]}, location :{randlocation["geometry"]["location"]}")