import os
from supabase import create_client, Client
#gets the info from the google docs
url: str = os.environ.get("https://developers.google.com/maps/documentation")
key: str = os.environ.get("?")
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