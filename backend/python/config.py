# Init the secret stuff - loads environment variables from backend/.env
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend directory
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

Project_URL = os.getenv("Project_URL")
Secret_key = os.getenv("Secret_key")

if not Project_URL or not Secret_key:
    raise RuntimeError("Missing Project_URL or Secret_key in environment")

