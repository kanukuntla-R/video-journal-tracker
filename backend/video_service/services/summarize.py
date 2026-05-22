from backend.shared.ollama import ollama_chat
from backend.shared.settings import OLLAMA_SUMMARY_MODEL

SYSTEM_PROMPT = (
    "You are a helpful assistant that summarizes personal journal entries. "
    "Write concise, warm, practical summaries. Do not invent details."
)


def generate_summary(transcript: str) -> str:
    clean_transcript = (transcript or "").strip()
    if not clean_transcript:
        return "No transcript was available to summarize."

    return ollama_chat(
        model=OLLAMA_SUMMARY_MODEL,
        temperature=0.4,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    "Summarize this journal entry in exactly 3 short sentences. "
                    "Mention the main activities, mood, and any useful next step if present.\n\n"
                    f"{clean_transcript}"
                ),
            },
        ],
    )
