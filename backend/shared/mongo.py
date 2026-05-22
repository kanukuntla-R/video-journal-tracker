# backend/shared/mongo.py
from motor.motor_asyncio import AsyncIOMotorClient

from backend.shared.settings import MONGO_DB_NAME, MONGO_URI

_client = AsyncIOMotorClient(MONGO_URI)
_db = _client[MONGO_DB_NAME]

def get_db():
    return _db


    
