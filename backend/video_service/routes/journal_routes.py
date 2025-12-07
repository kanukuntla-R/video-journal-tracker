from fastapi import APIRouter
from backend.video_service.models.journal import JournalEntry
from backend.video_service.services.database import save_journal_entry
from datetime import datetime 

router = APIRouter()

@router.post("/upload-journal")
async def upload_journal(entry: JournalEntry):

    if not entry.created_at:
        entry.created_at = datetime.utcnow()
    
    journal_id = await save_journal_entry(entry)
    return {"message": "journal saved ","journal_id": journal_id}

