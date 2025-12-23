# backend/shared/mongo.py
import os
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

_client = AsyncIOMotorClient(MONGO_URI)
_db = _client["video_journal_db"]

def get_db():
    return _db


    