from backend.video_service.services.transcribe import transcribe_audio


file_path = "backend/video_service/test_audio_converted.mp3"
result =  transcribe_audio(file_path)
print("Transcription:", result)
