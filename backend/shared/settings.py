import os
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = PROJECT_ROOT / "backend"

load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(BACKEND_ROOT / ".env", override=True)


def _get_csv_env(name: str, default: list[str]) -> list[str]:
    raw = os.getenv(name)
    if not raw:
        return default
    return [item.strip() for item in raw.split(",") if item.strip()]


def _get_path_env(name: str, default: Path) -> Path:
    raw = os.getenv(name)
    if not raw:
        return default
    path = Path(raw).expanduser()
    return path if path.is_absolute() else PROJECT_ROOT / path


def _get_int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if not raw:
        return default
    return int(raw)


def _get_bool_env(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
]

APP_NAME = os.getenv("APP_NAME", "Video Journal Tracker")
CORS_ORIGINS = _get_csv_env("CORS_ORIGINS", DEFAULT_CORS_ORIGINS)
AUTH_REQUIRED = _get_bool_env("AUTH_REQUIRED", False)
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "video_journal_db")

MEDIA_STORAGE_ROOT = _get_path_env(
    "MEDIA_STORAGE_ROOT",
    BACKEND_ROOT / "video_service" / "storage",
)
TEMP_UPLOAD_ROOT = _get_path_env(
    "TEMP_UPLOAD_ROOT",
    BACKEND_ROOT / "video_service" / "temp",
)
MAX_UPLOAD_BYTES = _get_int_env("MAX_UPLOAD_BYTES", 250 * 1024 * 1024)
ALLOWED_MEDIA_EXTENSIONS = set(
    _get_csv_env(
        "ALLOWED_MEDIA_EXTENSIONS",
        [
            ".aac",
            ".avi",
            ".flac",
            ".m4a",
            ".m4v",
            ".mkv",
            ".mov",
            ".mp3",
            ".mp4",
            ".ogg",
            ".wav",
            ".webm",
        ],
    )
)

WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
WHISPER_LANGUAGE = os.getenv("WHISPER_LANGUAGE") or None

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_SUMMARY_MODEL = os.getenv("OLLAMA_SUMMARY_MODEL", "llama3.2:3b")
OLLAMA_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL", "llama3.2:3b")
OLLAMA_TIMEOUT_SECONDS = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))
