import os
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

class Config:
    PORT = int(os.getenv("PORT", 8000))
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/sibis")
    HOST = os.getenv("HOST", "0.0.0.0")
    
config = Config()
