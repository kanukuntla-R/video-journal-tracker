# backend/chatbot_service/services/chat.py
from typing import Any, Dict, List, Optional

from backend.shared.journals_repo import find_journals
from backend.shared.ollama import ollama_chat
from backend.shared.settings import OLLAMA_CHAT_MODEL

SYSTEM_PROMPT = """You are a helpful “Second Brain” assistant for a video journal app.
- Be concise and practical.
- If you reference journals, use the provided journal context.
- If you don't have enough context, ask one short follow-up question.
"""

def build_context(docs: List[Dict[str, Any]]) -> str:
    if not docs:
        return "No journal entries found yet."

    lines = []
    for d in docs[:12]:
        date = d.get("date", "unknown-date")
        summary = (d.get("summary") or "").strip()
        transcript = (d.get("transcript") or "").strip()
        text = summary if summary else transcript
        if not text:
            text = "(no transcript/summary yet)"
        if len(text) > 350:
            text = text[:350] + "…"
        lines.append(f"- {date}: {text}")
    return "\n".join(lines)

async def generate_chat_reply(
    message: str,
    history: List[Dict[str, str]],
    user_id: Optional[str] = "anonymous",
) -> str:
    # Pull recent journals for that user
    query = {"user_id": user_id} if user_id else {}
    docs = await find_journals(query=query, limit=30)

    context = build_context(docs)

    msgs: List[Dict[str, str]] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": f"Journal context:\n{context}"},
    ]

    # Keep only last 12 history messages
    for h in history[-12:]:
        role = h.get("role")
        content = (h.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            msgs.append({"role": role, "content": content})

    msgs.append({"role": "user", "content": message})

    return ollama_chat(
        model=OLLAMA_CHAT_MODEL,
        messages=msgs,
        temperature=0.4,
    )
