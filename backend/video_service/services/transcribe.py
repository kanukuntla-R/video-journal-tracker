from functools import lru_cache
from typing import Optional

from faster_whisper import WhisperModel
from mutagen import File as MutagenFile

from backend.shared.settings import (
    WHISPER_COMPUTE_TYPE,
    WHISPER_DEVICE,
    WHISPER_LANGUAGE,
    WHISPER_MODEL_SIZE,
)


@lru_cache(maxsize=1)
def _get_model() -> WhisperModel:
    return WhisperModel(
        WHISPER_MODEL_SIZE,
        device=WHISPER_DEVICE,
        compute_type=WHISPER_COMPUTE_TYPE,
    )


def transcribe_audio(file_path: str) -> str:
    """
    Transcribe media locally with faster-whisper instead of sending audio to a paid API.
    The model is loaded once per process and reused for future requests.
    """
    try:
        segments, _info = _get_model().transcribe(
            file_path,
            beam_size=5,
            language=WHISPER_LANGUAGE,
        )
        transcript = " ".join(segment.text.strip() for segment in segments).strip()
        return transcript or "Transcription failed: no speech detected"
    except Exception as exc:
        print(f"Transcription error: {exc}")
        return "Transcription Failed "


def get_audio_duration(file_path: str) -> int:
    audio: Optional[object] = MutagenFile(file_path)
    if audio is None or not getattr(audio, "info", None):
        return 0
    return int(getattr(audio.info, "length", 0) or 0)
