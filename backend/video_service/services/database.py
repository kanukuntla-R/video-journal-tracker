from multiprocessing.connection import Client
from typing import List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import ValidationError

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


async def get_journals(user_id: Optional[str] = None, limit: int = 50) -> List[JournalEntry]:
    query = {}
    if user_id:
        query["user_id"] = user_id

    cursor = journal_collection.find(query).sort("created_at", -1).limit(limit)

    journals: List[JournalEntry] = []
    async for doc in cursor:
        try:
            journals.append(JournalEntry(**doc))
        except ValidationError as e:
            bad_id = doc.get("_id")
            print(f"Skipping invalid journal {bad_id}: {e}")
            # just skip this document

    return journals


async def get_journal_by_id(journal_id: str) -> Optional[JournalEntry]:
    try:
        obj_id = ObjectId(journal_id)
    except Exception:
        return None

    doc = await journal_collection.find_one({"_id": obj_id})
    if not doc:
        return None

    return JournalEntry(**doc)
