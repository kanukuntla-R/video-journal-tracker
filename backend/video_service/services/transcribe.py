from dotenv import load_dotenv
from mutagen.mp3 import MP3 
import os
import requests

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def transcribe_audio(file_path: str) -> str:
    with open(file_path, "rb") as audio_file:
        response = requests.post(

            "https://api.openai.com/v1/audio/transcriptions",
            headers = {
                "Authorization" : f"Bearer {OPENAI_API_KEY}"

            },
            files = {
                "file" : (file_path,audio_file,"audio/mp3")
            },
            data = {

                "model" : "whisper-1"
            }
        )

    if response.status_code == 200 :
        return response.json()["text"]
    else:
        print("Error", response.text)
        return "Transcription Failed "

def get_audio_duration(file_path: str) -> int:
    audio = MP3(file_path)
    return int(audio.info.length)
