# Video Journal Tracker

A full-stack application for tracking video journal entries with transcription and summarization capabilities.

## Prerequisites

- **Node.js** (v16 or higher) and npm
- **Python** (v3.8 or higher)
- **MongoDB** (running locally on port 27017, or configure `MONGO_URI` environment variable)

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
   pip install fastapi uvicorn motor pydantic python-dotenv openai requests mutagen
   ```

4. **Set up environment variables** (optional):
   - Create a `.env` file in the `backend` directory if needed
   - Set `MONGO_URI` if MongoDB is not running on `localhost:27017`
   - Add any API keys (e.g., OpenAI API key) if required

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
