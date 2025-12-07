from fastapi import FastAPI
from backend.video_service.routes import journal_routes  
from backend.video_service.routes import transcribe_routes



app = FastAPI()
app.include_router(journal_routes.router)
app.include_router(transcribe_routes.router)
