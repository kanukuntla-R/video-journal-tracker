# backend/chatbot_service/services/chat.py
from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.shared.journals_repo import find_journals
from backend.shared.ollama import ollama_chat
from backend.shared.settings import OLLAMA_CHAT_MODEL

SYSTEM_PROMPT = """You are a helpful “Second Brain” assistant for a video journal app.
- Be concise and practical.
- If you reference journals, use the provided journal context.
- The journal context is authoritative. Do not say you lack journal context when entries are listed.
- If the user asks for their last/latest/recent journal, answer from the first journal in the context.
- If you truly don't have enough context, ask one short follow-up question.
"""

def _looks_like_latest_journal_question(message: str) -> bool:
    text = (message or "").lower()
    latest_words = ("last journal", "latest journal", "recent journal", "most recent journal")
    if any(phrase in text for phrase in latest_words):
        return True
    return ("when" in text and "journal" in text and any(word in text for word in ("last", "latest", "recent")))

def _format_created_at(value: Any) -> str:
    if isinstance(value, datetime):
      return value.strftime("%b %-d, %Y at %-I:%M %p")

    raw = str(value or "").strip()
    if not raw:
        return ""

    try:
        parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        return parsed.strftime("%b %-d, %Y at %-I:%M %p")
    except Exception:
        return raw

def _answer_latest_journal(docs: List[Dict[str, Any]]) -> Optional[str]:
    if not docs:
        return "I could not find any journal entries yet."

    latest = docs[0]
    journal_date = latest.get("date") or "unknown date"
    created_at = _format_created_at(latest.get("created_at"))
    summary = (latest.get("summary") or "").strip()
    transcript = (latest.get("transcript") or "").strip()
    preview = summary or transcript
    if len(preview) > 220:
        preview = preview[:220] + "..."

    if created_at and created_at != journal_date:
        answer = f"Your latest saved journal was created on {created_at}. It is filed under {journal_date}."
    else:
        answer = f"Your latest journal is from {journal_date}."

    if preview:
        answer += f"\n\nQuick note: {preview}"

    return answer

def build_context(docs: List[Dict[str, Any]]) -> str:
    if not docs:
        return "No journal entries found yet."

    lines = []
    for d in docs[:12]:
        date = d.get("date", "unknown-date")
        created_at = _format_created_at(d.get("created_at"))
        summary = (d.get("summary") or "").strip()
        transcript = (d.get("transcript") or "").strip()
        text = summary if summary else transcript
        if not text:
            text = "(no transcript/summary yet)"
        if len(text) > 350:
            text = text[:350] + "…"
        created = f" created {created_at};" if created_at else ""
        lines.append(f"- journal date {date};{created} {text}")
    return "\n".join(lines)

async def generate_chat_reply(
    message: str,
    history: List[Dict[str, str]],
    user_id: Optional[str] = "anonymous",
) -> str:
    # Pull recent journals for that user
    query = {"user_id": user_id} if user_id else {}
    docs = await find_journals(query=query, limit=30)

    if _looks_like_latest_journal_question(message):
        return _answer_latest_journal(docs) or "I could not find any journal entries yet."

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
