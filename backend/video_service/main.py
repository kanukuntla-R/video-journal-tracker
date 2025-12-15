from fastapi import FastAPI
from backend.video_service.routes import journal_routes  
from backend.video_service.routes import transcribe_routes
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI()

# Development CORS allowlist. Add your LAN IP so mobile devices can reach it.
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
    # Replace with your LAN IP (use `ifconfig`/`ipconfig`) so phone/tablet can call the API
    "http://10.155.225.19:5173",
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

app.include_router(journal_routes.router)
app.include_router(transcribe_routes.router)
