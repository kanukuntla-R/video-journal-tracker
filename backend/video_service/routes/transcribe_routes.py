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

        # 2) Check for video files (case-insensitive, common formats)
        file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        video_extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']

        transcript = None
        summary = None
        duration = None

        if file_ext in video_extensions:
            # For video files: keep original video, extract audio temporarily for transcription
            base_path = os.path.splitext(temp_path)[0]
            temp_mp3_path = base_path + "_temp_audio.mp3"
            
            try:
                # Extract audio temporarily for transcription
                extract_audio_from_video(temp_path, temp_mp3_path)
                if not os.path.exists(temp_mp3_path):
                    raise Exception(f"FFmpeg extraction failed: output file not created")
                
                # Transcribe using the temporary audio file
                transcript = transcribe_audio(temp_mp3_path)
                summary = generate_summary(transcript)
                duration = get_audio_duration(temp_mp3_path)
                
                # Clean up temporary audio file
                if os.path.exists(temp_mp3_path):
                    os.remove(temp_mp3_path)
                
                # Keep the original video - this will be saved to storage
                final_file_path = temp_path
                
            except subprocess.CalledProcessError as e:
                # Clean up on error
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                if os.path.exists(temp_mp3_path):
                    os.remove(temp_mp3_path)
                raise HTTPException(
                    status_code=500, 
                    detail=f"Failed to extract audio from video: {str(e)}"
                )
            except Exception as e:
                # Clean up on any error
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                if os.path.exists(temp_mp3_path):
                    os.remove(temp_mp3_path)
                raise HTTPException(
                    status_code=500,
                    detail=f"Video processing error: {str(e)}"
                )
        else:
            # For audio files: transcribe directly
            final_file_path = temp_path
            transcript = transcribe_audio(final_file_path)
            summary = generate_summary(transcript)
            duration = get_audio_duration(final_file_path)

        # 3) Move file into permanent storage: storage/{user_id}/{date}/journal_<uuid>.<original_ext>
        user_folder = os.path.join(AUDIO_STORAGE_ROOT, user_id)
        date_folder = os.path.join(user_folder, date)
        os.makedirs(date_folder, exist_ok=True)

        # Preserve original file extension
        original_ext = os.path.splitext(file.filename)[1] if file.filename else ".mp3"
        stored_filename = f"journal_{uuid.uuid4().hex}{original_ext}"
        stored_file_path = os.path.join(date_folder, stored_filename)

        # Move file to storage
        shutil.move(final_file_path, stored_file_path)

        # 4) Save journal entry in Mongo with the permanent file path (video or audio)
        journal = JournalEntry(
            user_id=user_id,
            date=date,
            video_path=stored_file_path,  # This will be the video file path for videos
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