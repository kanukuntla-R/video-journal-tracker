from typing import List, Optional
from pydantic import ValidationError

from backend.video_service.models.journal import JournalEntry
from backend.shared.journals_repo import (
    insert_journal,
    find_journals,
    find_journal_by_id,
)


async def save_journal_entry(entry: JournalEntry) -> str:
    """Save a JournalEntry to MongoDB via the shared repository layer."""
    entry_dict = entry.dict(by_alias=True, exclude_unset=True, exclude_none=True)
    return await insert_journal(entry_dict)


async def get_journals(
    user_id: Optional[str] = None,
    date: Optional[str] = None,
    limit: int = 50,
) -> List[JournalEntry]:
    """Fetch journals and convert them into JournalEntry models."""
    query: dict = {}
    if user_id:
        query["user_id"] = user_id
    if date:
        query["date"] = date

    docs = await find_journals(query=query, limit=limit)

    journals: List[JournalEntry] = []
    for doc in docs:
        try:
            journals.append(JournalEntry(**doc))
        except ValidationError as e:
            bad_id = doc.get("_id")
            print(f"Skipping invalid journal {bad_id}: {e}")

    return journals


async def get_journal_by_id(journal_id: str) -> Optional[JournalEntry]:
    """Fetch a single journal by Mongo _id string."""
    doc = await find_journal_by_id(journal_id)
    if not doc:
        return None

    return JournalEntry(**doc)
