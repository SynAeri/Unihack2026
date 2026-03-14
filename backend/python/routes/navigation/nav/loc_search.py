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

params_id = {
    "location": locationcoord,
    "radius": radius,
    "key": API_Key
}

response = requests.get(endpoint_url, params=params)
data = response.json()

response_id = requests.get(endpoint_url, params=params_id)
data_id = response_id.json()
place_ids = []
    

if len(data) > 0:
    randlocation = data["results"][random.randint(0, int(len(data["results"])) - 1)]
    print(f"name: {randlocation["name"]}, address : {randlocation["vicinity"]}")
else:
    #gets place_ids to better search for reviews

    for id in data_id['results']:        
        place_ids.append(id["place_id"])
    print(place_ids)
    #to better search for reviews
    
    #finds reviews and checks if the keyword is in it
    matching_ids = []
    
    response_review = requests.get(endpoint_url, params= reviews_param)
    data_review = response_review.json()

    #error occuring here 
    for id in place_ids:
        reviews_param = {
    'place_id': 'ChIJm7Ex8UmuEmsR37p4Hm0D0VI',
    'fields': 'name,rating,reviews',
    "key": API_Key
}
        response_review = requests.get(endpoint_url, params= reviews_param)
        data_review = response_review.json()
        print(data_review)
        
        
        if data_review['status'] == 'OK':
            break_review = False
            reviews = data_review['result'].get('reviews', [])
            print(reviews)
            
            for review in data_review:
                
                if keyword in review['text']:
                    matching_ids.append(place_id)
                    break
            if break_review:
                break
    if len(matching_ids) != 0:
        print(f"No places with {keyword} found, showing instead locations with {keyword} in reviews")
        for id in matching_ids:
            place_id = id
            final_results_param = {
            'place_id': place_id,
            "key": API_Key
        }
            response_final_results = requests.get(endpoint_url, params= final_results_param)
            data_final_results = response_final_results.json()
            results_review = data_final_results["results"]
            print(f"name: {results_review["name"]}, address : {results_review["vicinity"]}")
    else:
        print(f"No location with {keyword} found")
        