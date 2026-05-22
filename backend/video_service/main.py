from fastapi import FastAPI
from backend.video_service.routes import journal_routes  
from backend.video_service.routes import transcribe_routes
from fastapi.middleware.cors import CORSMiddleware

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

app.include_router(journal_routes.router)
app.include_router(transcribe_routes.router)
