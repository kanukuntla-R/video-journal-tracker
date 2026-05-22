# backend/api_gateway/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.video_service.routes import journal_routes, transcribe_routes
from backend.chatbot_service.routes.chat_routes import router as chat_router
from backend.stats_service.routes import stats_routes
from backend.shared.settings import APP_NAME, CORS_ORIGINS

app = FastAPI(title=APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
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
