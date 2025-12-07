from datetime import datetime 
from fastapi import APIRouter
from backend.video_service.models.journal import JournalEntry
# from backend.video_service.services.database import save_journal_entry
from typing import List, Optional
from fastapi import HTTPException
from backend.video_service.services.database import (
    save_journal_entry,
    get_journals,
    get_journal_by_id,
)



router = APIRouter()

@router.post("/upload-journal")
async def upload_journal(entry: JournalEntry):

    if not entry.created_at:
        entry.created_at = datetime.utcnow()
    
    journal_id = await save_journal_entry(entry)
    return {"message": "journal saved ","journal_id": journal_id}


@router.get("/journals", response_model=List[JournalEntry])
async def list_journals(
    user_id: Optional[str] = None,
    date: Optional[str] = None,
    limit: int = 50,
):
    journals = await get_journals(user_id=user_id, date=date, limit=limit)
    return journals

@router.get("/journals/{journal_id}", response_model=JournalEntry)
async def get_journal(journal_id: str):
    journal = await get_journal_by_id(journal_id)
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
    return journal
