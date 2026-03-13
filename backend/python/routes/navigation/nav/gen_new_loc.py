import os
from supabase import create_client, Client
#gets the info from the google docs
url: str = os.environ.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json")
key: str = os.environ.get("AIzaSyBkCPN6Fa7qDphn2oteJrY-wXC66_4arpM")
supabase: Client = create_client(url, key)

# for the client to input their keyword
keyword = "placeholder"

#to get the keyword out of the database
response = (
    supabase.table("locations")
    .select("*", count= keyword)
    .execute()
)

#for item in data 
data = response.data

print(keyword)
for row in data:
    print(f"name: {row["name"]}, location :{row["loc"]}")