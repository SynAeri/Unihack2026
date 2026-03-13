from supabase import create_client, Client
from python.config import Project_URL, Secret_key

supabase: Client = create_client(Project_URL, Secret_key)
