from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from backend.video_service.services.transcribe import transcribe_audio, get_audio_duration
from backend.video_service.services.database import save_journal_entry
from backend.video_service.utils.extract_audio import extract_audio_from_video
from backend.video_service.models.journal import JournalEntry
from backend.video_service.services.summarize import generate_summary
from datetime import datetime
import os
import shutil
import uuid

AUDIO_STORAGE_ROOT = "backend/video_service/storage"
router = APIRouter()


@router.post("/transcribe-audio")
async def transcribe_audio_endpoint(
    file: UploadFile = File(...),
    user_id: str = Form(default="anonymous"),
    date: str = Form(default=datetime.utcnow().strftime("%Y-%m-%d")),
):
    try:
        # 1) Save uploaded file to a temporary path
        filename = f"temp_{uuid.uuid4().hex}_{file.filename}"
        temp_path = f"backend/video_service/temp/{filename}"

        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2) If it's .mp4, extract audio to .mp3; otherwise just use the audio file
        if file.filename.endswith(".mp4"):
            mp3_path = temp_path.replace(".mp4", ".mp3")
            extract_audio_from_video(temp_path, mp3_path)
            os.remove(temp_path)  # we don't need the original video anymore
            final_audio_path = mp3_path
        else:
            final_audio_path = temp_path

        # 3) Move final audio into permanent storage: storage/{user_id}/{date}/journal_<uuid>.mp3
        user_folder = os.path.join(AUDIO_STORAGE_ROOT, user_id)
        date_folder = os.path.join(user_folder, date)
        os.makedirs(date_folder, exist_ok=True)

        stored_filename = f"journal_{uuid.uuid4().hex}.mp3"
        stored_audio_path = os.path.join(date_folder, stored_filename)

        # Move from temp (or mp3_path) into storage
        shutil.move(final_audio_path, stored_audio_path)
        final_audio_path = stored_audio_path

        # 4) Call Whisper + summary + duration on the stored file
        transcript = transcribe_audio(final_audio_path)
        summary = generate_summary(transcript)
        duration = get_audio_duration(final_audio_path)

        # 5) Save journal entry in Mongo with the permanent audio path
        journal = JournalEntry(
            user_id=user_id,
            date=date,
            video_path=final_audio_path,
            transcript=transcript,
            summary=summary,
            duration=duration,
            created_at=datetime.utcnow(),
        )
        journal_id = await save_journal_entry(journal)

        return {
            "transcript": transcript,
            "journal_id": journal_id,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))