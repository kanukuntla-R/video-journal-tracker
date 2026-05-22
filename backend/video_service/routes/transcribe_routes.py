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
import subprocess
from pathlib import Path

from backend.shared.settings import MEDIA_STORAGE_ROOT, TEMP_UPLOAD_ROOT, PROJECT_ROOT

router = APIRouter()


def _stored_path_for_db(file_path: Path) -> str:
    try:
        return file_path.relative_to(PROJECT_ROOT).as_posix()
    except ValueError:
        return file_path.as_posix()


@router.post("/transcribe-audio")
async def transcribe_audio_endpoint(
    file: UploadFile = File(...),
    user_id: str = Form(default="anonymous"),
    date: str = Form(default=datetime.utcnow().strftime("%Y-%m-%d")),
):
    try:
        # 1) Save uploaded file to a temporary path
        filename = f"temp_{uuid.uuid4().hex}_{file.filename}"
        temp_path = TEMP_UPLOAD_ROOT / filename

        temp_path.parent.mkdir(parents=True, exist_ok=True)
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2) Check for video files (case-insensitive, common formats)
        file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        video_extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']

        transcript = None
        summary = None
        duration = None

        if file_ext in video_extensions:
            # For video files: keep original video, extract audio temporarily for transcription
            temp_mp3_path = temp_path.with_name(f"{temp_path.stem}_temp_audio.mp3")
            
            try:
                # Extract audio temporarily for transcription
                extract_audio_from_video(str(temp_path), str(temp_mp3_path))
                if not temp_mp3_path.exists():
                    raise Exception(f"FFmpeg extraction failed: output file not created")
                
                # Transcribe using the temporary audio file
                transcript = transcribe_audio(str(temp_mp3_path))
                summary = generate_summary(transcript)
                duration = get_audio_duration(str(temp_mp3_path))
                
                # Clean up temporary audio file
                if temp_mp3_path.exists():
                    temp_mp3_path.unlink()
                
                # Keep the original video - this will be saved to storage
                final_file_path = temp_path
                
            except subprocess.CalledProcessError as e:
                # Clean up on error
                if temp_path.exists():
                    temp_path.unlink()
                if temp_mp3_path.exists():
                    temp_mp3_path.unlink()
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to extract audio from video: {str(e)}"
                )
            except Exception as e:
                # Clean up on any error
                if temp_path.exists():
                    temp_path.unlink()
                if temp_mp3_path.exists():
                    temp_mp3_path.unlink()
                raise HTTPException(
                    status_code=500,
                    detail=f"Video processing error: {str(e)}"
                )
        else:
            # For audio files: transcribe directly
            final_file_path = temp_path
            transcript = transcribe_audio(str(final_file_path))
            summary = generate_summary(transcript)
            duration = get_audio_duration(str(final_file_path))

        # 3) Move file into permanent storage: storage/{user_id}/{date}/journal_<uuid>.<original_ext>
        date_folder = MEDIA_STORAGE_ROOT / user_id / date
        date_folder.mkdir(parents=True, exist_ok=True)

        # Preserve original file extension
        original_ext = os.path.splitext(file.filename)[1] if file.filename else ".mp3"
        stored_filename = f"journal_{uuid.uuid4().hex}{original_ext}"
        stored_file_path = date_folder / stored_filename

        # Move file to storage
        shutil.move(final_file_path, stored_file_path)

        # 4) Save journal entry in Mongo with the permanent file path (video or audio)
        journal = JournalEntry(
            user_id=user_id,
            date=date,
            video_path=_stored_path_for_db(stored_file_path),  # This will be the video file path for videos
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
