from fastapi import FastAPI
from backend.stats_service.routes import stats_routes

app = FastAPI()
app.include_router(stats_routes.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
