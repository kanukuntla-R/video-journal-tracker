from multiprocessing.connection import Client
from motor.motor_asyncio import AsyncIOMotorClient
import os


MONGO_URL = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client["video_journal_db"]
journal_collection = db["journal"]


from backend.video_service.models.journal import JournalEntry

async def save_journal_entry(entry: JournalEntry):
    entry_dict = entry.dict(by_alias=True, exclude_unset=True, exclude_none=True)
    result = await journal_collection.insert_one(entry_dict)
    return str(result.inserted_id)


