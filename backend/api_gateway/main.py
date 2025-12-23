# backend/api_gateway/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.video_service.routes import journal_routes, transcribe_routes
from backend.chatbot_service.routes.chat_routes import router as chat_router
from backend.stats_service.routes import stats_routes

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
    "http://192.168.0.20:5173",
    "http://10.155.225.19:5173",
    "http://10.155.145.218:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# video_service routes
app.include_router(journal_routes.router)
app.include_router(transcribe_routes.router)

# chatbot routes
app.include_router(chat_router)

# stats routes
app.include_router(stats_routes.router)