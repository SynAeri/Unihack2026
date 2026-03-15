# Init the secret stuff - loads environment variables from backend/.env
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

Project_URL = os.getenv("Project_URL")
Secret_key = os.getenv("Secret_key")
Google_api = os.getenv("Google_api")
Serp_api = os.getenv("Serp_api")
Gemini_api_key = os.getenv("GEMINI_API_KEY")

if not Project_URL or not Secret_key:
    raise RuntimeError("Missing Project_URL or Secret_key in environment")

if not Google_api:
    raise RuntimeError("Missing Google_api in environment")

if not Serp_api:
    raise RuntimeError("Missing Serp_api in environment")

if not Gemini_api_key:
    raise RuntimeError("Missing GEMINI_API_KEY in environment")

