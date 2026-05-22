# Video Journal Tracker

A full-stack application for tracking video journal entries with transcription and summarization capabilities.

## Prerequisites

- **Node.js** (v16 or higher) and npm
- **Python** (v3.8 or higher)
- **MongoDB** (running locally on port 27017, or configure `MONGO_URI` environment variable)
- **FFmpeg** (required for extracting audio from uploaded video files)
- **Ollama** (required for local summary generation)

## Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Activate the virtual environment** (if not already activated):
   ```bash
   # On macOS/Linux:
   source ../venv/bin/activate
   
   # On Windows:
   ..\venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   
   **Note:** If you encounter missing dependencies, you may need to install:
   ```bash
   pip install fastapi uvicorn motor pydantic python-dotenv mutagen faster-whisper python-multipart
   ```

4. **Set up environment variables** (optional):
   - Create a `.env` file in the `backend` directory if needed
   - Set `MONGO_URI` if MongoDB is not running on `localhost:27017`
   - Optional backend settings:
     - `APP_NAME=Video Journal Tracker`
     - `CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173,http://127.0.0.1:8000`
     - `MONGO_DB_NAME=video_journal_db`
     - `MEDIA_STORAGE_ROOT=backend/video_service/storage`
     - `TEMP_UPLOAD_ROOT=backend/video_service/temp`
   - Transcription runs locally with `faster-whisper`; no OpenAI key is needed for transcription
   - Optional transcription settings:
     - `WHISPER_MODEL_SIZE=base` (`tiny`, `base`, `small`, `medium`, etc.)
     - `WHISPER_DEVICE=cpu`
     - `WHISPER_COMPUTE_TYPE=int8`
     - `WHISPER_LANGUAGE=en` if you want to force English
   - Summary generation and chatbot replies run locally with Ollama:
     - Install/start Ollama
     - Pull a local model: `ollama pull llama3.2:3b`
     - Optional settings:
       - `OLLAMA_BASE_URL=http://localhost:11434`
       - `OLLAMA_SUMMARY_MODEL=llama3.2:3b`
       - `OLLAMA_CHAT_MODEL=llama3.2:3b`
       - `OLLAMA_TIMEOUT_SECONDS=120`

5. **Start MongoDB** (if running locally):
   ```bash
   # On macOS with Homebrew:
   brew services start mongodb-community
   
   # Or run MongoDB directly:
   mongod
   ```

6. **Run the backend server:**
   ```bash
   # From the backend directory, run the video service:
   uvicorn backend.video_service.main:app --reload --host 0.0.0.0 --port 8000
   
   # Or from the project root:
   uvicorn backend.video_service.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The backend API will be available at `http://127.0.0.1:8000`
   - API docs: `http://127.0.0.1:8000/docs`
   - Health check: `http://127.0.0.1:8000/health`

## Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

4. **Optional: Configure API URL**
   - Create a `.env` file in the `frontend` directory
   - Add: `VITE_API_BASE_URL=http://127.0.0.1:8000`
   - (This is the default, so only needed if you change the backend port)

## Running Both Services

### Option 1: Run in separate terminals

**Terminal 1 - Backend:**
```bash
cd backend
source ../venv/bin/activate  # or ..\venv\Scripts\activate on Windows
uvicorn backend.video_service.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Docker Setup

The project includes a Docker Compose setup for local development:

- `api`: FastAPI backend/API gateway
- `frontend`: Vite dev server
- `mongo`: MongoDB with a persistent volume
- `ollama`: optional local LLM service behind the `ai` profile

### Start the core stack

```bash
docker compose up --build
```

The app will be available at:

- Frontend: `http://localhost:5173`
- Backend/API docs: `http://localhost:8000/docs`
- MongoDB: `localhost:27017`

The Docker backend stores uploaded media, temp uploads, MongoDB data, and downloaded Whisper models in Docker volumes.

### Use local Ollama from your Mac

By default, the API container uses:

```env
OLLAMA_BASE_URL=http://host.docker.internal:11434
```

So if Ollama is running on your Mac, the container can use it for summaries and chat:

```bash
ollama serve
ollama pull llama3.2:3b
docker compose up --build
```

### Use Ollama as a Docker service

If you want Ollama containerized too:

```bash
OLLAMA_BASE_URL=http://ollama:11434 docker compose --profile ai up --build
```

Then pull the model inside the Ollama container:

```bash
docker compose exec ollama ollama pull llama3.2:3b
```

### Stop Docker services

```bash
docker compose down
```

To also delete Docker volumes:

```bash
docker compose down -v
```

### Option 2: Use a process manager (recommended for development)

You can use tools like `concurrently` or `npm-run-all` to run both services together. Add this to your root `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && source ../venv/bin/activate && uvicorn backend.video_service.main:app --reload --host 0.0.0.0 --port 8000",
    "dev:frontend": "cd frontend && npm run dev"
  }
}
```

## Project Structure

```
video-journal-tracker/
├── backend/
│   ├── video_service/      # Main FastAPI service
│   ├── api_gateway/        # API gateway (if used)
│   ├── chatbot_service/    # Chatbot service (if used)
│   └── stats_service/      # Stats service (if used)
├── frontend/               # React + Vite frontend
└── venv/                   # Python virtual environment
```

## Troubleshooting

- **Backend won't start**: Make sure MongoDB is running and the virtual environment is activated
- **CORS errors**: Check that the frontend URL is in the CORS origins list in `backend/video_service/main.py`
- **Port already in use**: Change the port using `--port` flag for uvicorn or modify Vite config
- **Module not found errors**: Make sure you're running uvicorn from the project root or have the Python path configured correctly
