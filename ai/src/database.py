from pymongo import MongoClient
from src.config import config
import logging

logger = logging.getLogger("sibis-ai")
logging.basicConfig(level=logging.INFO)

class Database:
    client: MongoClient = None
    db = None

    def connect(self):
        try:
            logger.info(f"Connecting to MongoDB at: {config.MONGO_URI}")
            self.client = MongoClient(config.MONGO_URI, serverSelectionTimeoutMS=5000)
            # Access database (derived from path/URI or defaults to sibis)
            db_name = config.MONGO_URI.split("/")[-1] or "sibis"
            # Strip query params if present
            db_name = db_name.split("?")[0]
            self.db = self.client[db_name]
            # Ping database to trigger connection verification
            self.client.admin.command('ping')
            logger.info("Successfully connected to MongoDB.")
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            raise e

    def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB client connection closed.")

db_helper = Database()

def get_db():
    if db_helper.db is None:
        db_helper.connect()
    return db_helper.db
