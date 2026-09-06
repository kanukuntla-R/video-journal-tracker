# Video Journal Tracker (Echo Mind)

Echo Mind is a full-stack video journaling application. Record or upload an entry, transcribe it locally with Faster Whisper, generate summaries and chat responses with Ollama, and review journal activity through calendar and statistics views.

## Features

- Record video or audio directly in the browser
- Upload common audio and video formats (up to 250 MB by default)
- Local speech-to-text transcription with Faster Whisper
- Local AI summaries and journal-aware chat with Ollama
- Dashboard, calendar, journal history, and activity statistics
- Email/password and Google authentication through Supabase
- Optional authentication bypass for local development
- FastAPI API gateway with interactive OpenAPI documentation
- Local and Docker-based development workflows

## Tech stack

- **Frontend:** React 19, Vite, React Router, Supabase JS, Day.js, Motion
- **Backend:** Python, FastAPI, Motor, Pydantic
- **Data:** MongoDB
- **Media and AI:** FFmpeg, Faster Whisper, Ollama

## Prerequisites

- Node.js 20 or newer and npm
- Python 3.10 or newer
- MongoDB 7 (local install or Docker)
- FFmpeg
- Ollama for summaries and chat
- A Supabase project when authentication is enabled

## Quick start

Run all commands in this section from the repository root.

### 1. Configure the environment

Copy the example files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

For local development without Supabase authentication, set:

```env
# backend/.env
AUTH_REQUIRED=false
```

```env
# frontend/.env
VITE_AUTH_BYPASS=true
```

The frontend environment must still contain syntactically valid Supabase URL and publishable-key values because the client is initialized at startup. Use a real Supabase project when authentication is enabled.

### 2. Install dependencies

macOS/Linux:

```bash
python3 -m venv venv
source venv/bin/activate
python -m pip install -r backend/requirements.txt
cd frontend && npm install && cd ..
```

Windows PowerShell:

```powershell
py -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
Set-Location frontend
npm install
Set-Location ..
```

### 3. Start supporting services

Start MongoDB, then start Ollama and download the configured model:

```bash
ollama serve
ollama pull llama3.2:3b
```

Ollama is only required for AI summaries and chat. The rest of the application can run without it.

### 4. Start the backend and frontend

Backend, from the repository root:

```bash
python -m uvicorn backend.api_gateway.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend, in another terminal:

```bash
cd frontend
npm run dev
```

Open:

- App: <http://localhost:5173>
- API documentation: <http://127.0.0.1:8000/docs>
- Health check: <http://127.0.0.1:8000/health>

## macOS development helper

The Bash helper can manage MongoDB installed through Homebrew, Ollama, the backend, and the frontend:

```bash
./vjt dev start
./vjt dev status
./vjt dev doctor
./vjt logs backend
./vjt service restart frontend
./vjt test all
./vjt dev stop
```

Equivalent `make` shortcuts include `make dev`, `make status`, `make test`, and `make stop`. Runtime state and logs are written under `.dev/`.

## Docker

Create `frontend/.env` before starting the stack, then run:

```bash
docker compose up --build
```

This starts the frontend, API gateway, and MongoDB. Uploaded media, temporary files, MongoDB data, and downloaded Whisper models are stored in Docker volumes.

To use Ollama running on the host, keep the default value:

```env
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

To run Ollama inside Docker instead:

```bash
OLLAMA_BASE_URL=http://ollama:11434 docker compose --profile ai up --build
docker compose exec ollama ollama pull llama3.2:3b
```

Stop the stack with:

```bash
docker compose down
```

Use `docker compose down -v` only when you also want to remove persistent development data.

## Configuration

Backend variables are documented in `backend/.env.example`.

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGO_DB_NAME` | `video_journal_db` | Database name |
| `AUTH_REQUIRED` | `false` | Require a valid Supabase bearer token |
| `SUPABASE_JWT_SECRET` | unset | JWT secret required when backend auth is enabled |
| `MEDIA_STORAGE_ROOT` | `backend/video_service/storage` | Persistent uploaded-media directory |
| `TEMP_UPLOAD_ROOT` | `backend/video_service/temp` | Temporary upload directory |
| `MAX_UPLOAD_BYTES` | `262144000` | Maximum upload size in bytes |
| `WHISPER_MODEL_SIZE` | `base` | Faster Whisper model (`tiny`, `base`, `small`, etc.) |
| `WHISPER_DEVICE` | `cpu` | Whisper execution device |
| `WHISPER_COMPUTE_TYPE` | `int8` | Whisper compute type |
| `WHISPER_LANGUAGE` | auto-detect | Optional language hint such as `en` |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_SUMMARY_MODEL` | `llama3.2:3b` | Summary model |
| `OLLAMA_CHAT_MODEL` | `llama3.2:3b` | Chat model |

Frontend variables are documented in `frontend/.env.example`.

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API URL |
| `VITE_AUTH_BYPASS` | Use the local anonymous user when set to `true` |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |

For deployed environments, enable both frontend Supabase authentication and `AUTH_REQUIRED=true` on the backend.

## API overview

The API gateway exposes:

- `GET /health` — service health
- `POST /transcribe-audio` — upload, transcribe, summarize, and save media
- `POST /upload-journal` — save a journal entry
- `GET /journals` — list entries, optionally filtered by date and user
- `GET /journals/{journal_id}` — retrieve one entry
- `GET /media/{user_id}/{date}/{filename}` — stream stored media
- `POST /chat` — send a journal-aware chat message
- `GET /stats/summary` — aggregate journal statistics
- `GET /stats/daily` — daily activity statistics

## Project structure

```text
video-journal-tracker/
├── backend/
│   ├── api_gateway/       # Combined FastAPI entry point
│   ├── chatbot_service/   # Ollama-backed chat
│   ├── shared/            # Authentication, settings, and repositories
│   ├── stats_service/     # Journal activity statistics
│   └── video_service/     # Uploads, transcription, summaries, and media
├── frontend/              # React/Vite application
├── scripts/dev.sh         # Local service manager
├── docker-compose.yml
├── Makefile
└── vjt                    # Development command entry point
```

## Verification

Run frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

Run backend checks from the repository root with the virtual environment active:

```bash
python -m compileall backend -q
python -m pip check
```

On macOS, `./vjt test all` runs the frontend, backend, and dependency-audit checks together.

## Troubleshooting

- **MongoDB connection errors:** Confirm MongoDB is running and `MONGO_URI` points to it.
- **Auth screen fails at startup:** Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, or enable `VITE_AUTH_BYPASS=true` locally.
- **401 responses:** Ensure frontend and backend auth modes match and `SUPABASE_JWT_SECRET` is correct.
- **Transcription fails:** Confirm FFmpeg is installed and the selected Whisper model can be downloaded.
- **Summary or chat fails:** Confirm Ollama is running and the configured model has been pulled.
- **CORS errors:** Add the frontend origin to `CORS_ORIGINS`.
- **Import errors:** Start Uvicorn from the repository root so the `backend` package is importable.
