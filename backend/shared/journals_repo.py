# backend/shared/journals_repo.py
from typing import Any, Dict, List, Optional
from bson import ObjectId
from backend.shared.mongo import get_db

def _journal_collection():
    return get_db()["journal"]

async def insert_journal(doc: Dict[str, Any]) -> str:
    result = await _journal_collection().insert_one(doc)
    return str(result.inserted_id)

async def find_journals(
    query: Optional[Dict[str, Any]] = None,
    limit: int = 50,
) -> List[Dict[str, Any]]:
    q = query or {}
    cursor = _journal_collection().find(q).sort("created_at", -1).limit(limit)
    return [doc async for doc in cursor]

async def find_journal_by_id(journal_id: str) -> Optional[Dict[str, Any]]:
    try:
        obj_id = ObjectId(journal_id)
    except Exception:
        return None

    return await _journal_collection().find_one({"_id": obj_id})