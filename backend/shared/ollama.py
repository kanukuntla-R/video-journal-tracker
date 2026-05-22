import json
from urllib import error, request

from backend.shared.settings import OLLAMA_BASE_URL, OLLAMA_TIMEOUT_SECONDS


def ollama_chat(
    *,
    model: str,
    messages: list[dict[str, str]],
    temperature: float = 0.4,
) -> str:
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": temperature,
        },
    }

    req = request.Request(
        f"{OLLAMA_BASE_URL}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=OLLAMA_TIMEOUT_SECONDS) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Ollama chat request failed: {detail}") from exc
    except error.URLError as exc:
        raise RuntimeError(
            f"Could not reach Ollama at {OLLAMA_BASE_URL}. "
            "Make sure Ollama is running and the requested model is pulled."
        ) from exc

    content = data.get("message", {}).get("content", "").strip()
    if not content:
        raise RuntimeError("Ollama returned an empty chat response")
    return content
