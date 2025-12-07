from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.video_service.services.transcribe import transcribe_audio
from backend.video_service.services.database import save_journal_entry
from backend.video_service.services.transcribe import get_audio_duration
from backend.video_service.utils.extract_audio import extract_audio_from_video
from backend.video_service.models.journal import JournalEntry
from backend.video_service.services.summarize import generate_summary
from datetime import datetime
from fastapi import Form
import os
import shutil
import uuid 


router = APIRouter()


@router.post("/transcribe-audio")
async def transcribe_audio_endpoint(
    file: UploadFile = File(...),
    user_id: str = Form(default="anonymous"),
    date: str = Form(default=datetime.utcnow().strftime("%Y-%m-%d")),
    
):
    try: 
        # making a unique file name 
        filename = f"temp_{uuid.uuid4().hex}_{file.filename}"
        temp_path = f"backend/video_service/temp/{filename}"

        # need to ssave teh upload file termporary location
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        

        if file.filename.endswith(".mp4"):
            mp3_path = temp_path.replace(".mp4", ".mp3")
            extract_audio_from_video(temp_path, mp3_path)
            os.remove(temp_path)
            final_audio_path = mp3_path
        else:
            final_audio_path = temp_path

        



            # callling whisper 
        transcript = transcribe_audio(final_audio_path)
        summary = generate_summary(transcript)
        duration = get_audio_duration(final_audio_path)

        journal = JournalEntry(
            user_id=user_id,
            date=date,
            video_path=temp_path,
            transcript=transcript,
            summary=summary,
            duration=duration,
            created_at=datetime.utcnow()
        )
        journal_id = await save_journal_entry(journal)


        os.remove(temp_path)

        return {
            "transcript": transcript,
            "journal_id": journal_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))