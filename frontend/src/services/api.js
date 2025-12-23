// FILE: frontend/src/services/api.js

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);

  // Try to read JSON error bodies (FastAPI often returns JSON on errors)
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const msg = typeof data === "string" ? data : (data?.detail || "Request failed");
    throw new Error(msg);
  }
  return data;
}

export async function getJournalsByDate(date, userId = null) {
  const params = new URLSearchParams();
  params.set("date", date);
  if (userId) params.set("user_id", userId);
  return request(`/journals?${params.toString()}`);
}

export async function getJournalById(journalId) {
  return request(`/journals/${journalId}`);
}

export async function transcribeMedia(file, { date, userId = "anonymous" } = {}) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("date", date);
  fd.append("user_id", userId);

  return request(`/transcribe-audio`, {
    method: "POST",
    body: fd,
  });
}

export async function getAllJournals(userId = null, limit = 1000) {
  const params = new URLSearchParams();
  if (userId) params.set("user_id", userId);
  params.set("limit", limit.toString());
  return request(`/journals?${params.toString()}`);
}
export async function chatWithBot({ message, history = [], user_id = "anonymous" }) {
  return request(`/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, user_id }),
  });
}