# backend/chatbot_service/routes/chat_routes.py
from typing import List, Literal, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.chatbot_service.services.chat import generate_chat_reply

router = APIRouter()

class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[HistoryItem] = []
    user_id: Optional[str] = "anonymous"

class ChatResponse(BaseModel):
    reply: str

@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    try:
        reply = await generate_chat_reply(
            message=req.message,
            history=[h.model_dump() for h in req.history],
            user_id=req.user_id,
        )
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))