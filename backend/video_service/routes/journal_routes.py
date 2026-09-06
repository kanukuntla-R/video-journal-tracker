from datetime import datetime 
from pathlib import Path
from fastapi import APIRouter, Depends
from backend.video_service.models.journal import JournalEntry
# from backend.video_service.services.database import save_journal_entry
from typing import List, Optional
from fastapi import HTTPException
from fastapi.responses import FileResponse
from backend.shared.auth import ensure_can_access_user, get_auth_user_id, resolve_user_id
from backend.shared.settings import MEDIA_STORAGE_ROOT
from backend.video_service.services.database import (
    save_journal_entry,
    get_journals,
    get_journal_by_id,
)



router = APIRouter()

@router.post("/upload-journal")
async def upload_journal(
    entry: JournalEntry,
    auth_user_id: str | None = Depends(get_auth_user_id),
):

    if not entry.created_at:
        entry.created_at = datetime.utcnow()

    entry.user_id = resolve_user_id(entry.user_id, auth_user_id)
    
    journal_id = await save_journal_entry(entry)
    return {"message": "journal saved ","journal_id": journal_id}


@router.get("/journals", response_model=List[JournalEntry])
async def list_journals(
    user_id: Optional[str] = None,
    date: Optional[str] = None,
    limit: int = 50,
    auth_user_id: str | None = Depends(get_auth_user_id),
):
    resolved_user_id = resolve_user_id(user_id, auth_user_id)
    journals = await get_journals(user_id=resolved_user_id, date=date, limit=limit)
    return journals

@router.get("/journals/{journal_id}", response_model=JournalEntry)
async def get_journal(
    journal_id: str,
    auth_user_id: str | None = Depends(get_auth_user_id),
):
    journal = await get_journal_by_id(journal_id)
    if not journal:
        raise HTTPException(status_code=404, detail="Journal not found")
    ensure_can_access_user(journal.user_id, auth_user_id)
    return journal

@router.get("/media/{user_id}/{date}/{filename:path}")
async def serve_media(user_id: str, date: str, filename: str):
    """
    Serve media files from storage.
    Example: /media/anonymous/2025-12-17/journal_abc123.mp3
    """
    storage_root = MEDIA_STORAGE_ROOT.resolve()
    file_path = (storage_root / user_id / date / filename).resolve()

    try:
        file_path.relative_to(storage_root)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Media file not found") from exc
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Media file not found")
    
    # Determine content type based on file extension
    ext = file_path.suffix.lower()
    if ext == ".mp3":
        media_type = "audio/mpeg"
    elif ext == ".mp4" or ext == ".m4v":
        media_type = "video/mp4"
    elif ext == ".mov":
        media_type = "video/quicktime"
    elif ext == ".webm":
        media_type = "video/webm"
    elif ext in [".avi", ".mkv"]:
        media_type = "video/mp4"  # Fallback to mp4 for browser compatibility
    else:
        media_type = "application/octet-stream"
    
    return FileResponse(
        file_path,
        media_type=media_type,
        filename=Path(filename).name
    )
