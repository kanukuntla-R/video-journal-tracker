// FILE: frontend/src/pages/Chatbot.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TabBar from "../components/TabBar.jsx";
import { chatWithBot } from "../services/api.js";

/** Small helper: unique id */
function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/** Minimal inline icons (so you don’t have to touch Icons.jsx) */
function Icon({ children }) {
  return <span className="chatIcon">{children}</span>;
}

export default function Chatbot() {
  const nav = useNavigate();

  // Optional topic chip (matches spec)
  const topic = useMemo(() => "Second Brain", []);

  const [messages, setMessages] = useState(() => [
    {
      id: uid(),
      role: "assistant",
      text:
        "👋 Hey! Ask me anything about your journal entries, patterns, or goals.\n\nTry: “What’s the biggest theme in my last 7 days?”",
      createdAt: Date.now(),
    },
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const scrollerRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function lastHistoryForApi(limit = 10) {
    // Backend only needs roles + content (no UI extras)
    const trimmed = messages.slice(-limit).map((m) => ({
      role: m.role,
      content: m.text,
    }));
    return trimmed;
  }

  async function sendText(text) {
    const clean = (text || "").trim();
    if (!clean || sending) return;

    const userMsg = { id: uid(), role: "user", text: clean, createdAt: Date.now() };

    // optimistic UI
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    // “thinking” placeholder
    const thinkingId = uid();
    setMessages((prev) => [
      ...prev,
      { id: thinkingId, role: "assistant", text: "…", createdAt: Date.now(), thinking: true },
    ]);

    try {
      const history = [...lastHistoryForApi(10), { role: "user", content: clean }];
      const res = await chatWithBot({ message: clean, history, user_id: "anonymous" });

      const reply = res?.reply || "I didn’t get a reply. Try again?";
      setMessages((prev) =>
        prev.map((m) => (m.id === thinkingId ? { ...m, text: reply, thinking: false } : m))
      );
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? {
                ...m,
                thinking: false,
                text:
                  "⚠️ I couldn’t reach the server.\n\nMake sure your backend is running on `http://127.0.0.1:8000` and you added the `/chat` endpoint.",
              }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    // “Professional” chat behavior:
    // Enter = send, Shift+Enter = newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText(input);
    }
  }

  async function copyText(t) {
    try {
      await navigator.clipboard.writeText(t);
    } catch {
      // ignore
    }
  }

  function speakText(t) {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.rate = 1;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
    } catch {
      // ignore
    }
  }

  function tryVoice() {
    // Optional: Web Speech API (works in Chrome, not always Safari)
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input isn’t supported in this browser yet.");
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (evt) => {
      const text = evt.results?.[0]?.[0]?.transcript || "";
      setInput((prev) => (prev ? `${prev} ${text}` : text));
    };
    rec.onerror = () => {};
    rec.start();
  }

  return (
    <div className="page chatPage">
      {/* Top bar */}
      <div className="chatTopBar">
        <button className="chatTopBtn tap" onClick={() => nav(-1)} aria-label="Back">
          <Icon>←</Icon>
        </button>

        <div className="chatTitleWrap">
          <div className="chatTitle">
            Chat bot <span className="chatTitleChevron">›</span>
          </div>
        </div>

        <div className="chatTopRight">
          <button className="chatTopBtn tap" aria-label="Rename (placeholder)">
            <Icon>✎</Icon>
          </button>
          <button className="chatTopBtn tap" aria-label="Share (placeholder)">
            <Icon>⤴︎</Icon>
          </button>
          <button className="chatTopBtn tap" aria-label="More (placeholder)">
            <Icon>⋯</Icon>
          </button>
        </div>
      </div>

      {/* Conversation */}
      <div className="chatScroller" ref={scrollerRef}>
        {messages.map((m, idx) => {
          const isAssistant = m.role === "assistant";
          const isFirst = idx === 0;

          return (
            <div key={m.id} className={`chatMsgRow ${isAssistant ? "left" : "right"}`}>
              {/* Optional topic chip on first message (spec) */}
              {isFirst && (
                <div className="chatTopicChipWrap">
                  <div className="chatTopicChip">{topic}</div>
                </div>
              )}

              <div className={`chatMsg ${isAssistant ? "assistant" : "user"}`}>
                <div className="chatMsgText">{m.text}</div>

                {/* Message action row (assistant only) */}
                {isAssistant && !m.thinking && (
                  <div className="chatActionRow">
                    <button className="chatActionBtn tap" onClick={() => copyText(m.text)} title="Copy">
                      <Icon>⧉</Icon>
                    </button>
                    <button className="chatActionBtn tap" onClick={() => speakText(m.text)} title="Listen">
                      <Icon>🔊</Icon>
                    </button>
                    <button className="chatActionBtn tap" title="Thumbs up (placeholder)">
                      <Icon>👍</Icon>
                    </button>
                    <button className="chatActionBtn tap" title="Thumbs down (placeholder)">
                      <Icon>👎</Icon>
                    </button>
                    <button className="chatActionBtn tap" title="Share (placeholder)">
                      <Icon>↗</Icon>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input bar */}
      <div className="chatComposer">
        <button className="chatCircleBtn tap" aria-label="Tools (placeholder)">
          <Icon>+</Icon>
        </button>

        <div className="chatInputPill">
          <textarea
            className="chatInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask anything"
            rows={1}
          />
        </div>

        {input.trim().length > 0 ? (
          <button
            className="chatSendBtn tap"
            onClick={() => sendText(input)}
            aria-label="Send"
            disabled={sending}
          >
            <Icon>➤</Icon>
          </button>
        ) : (
          <button className="chatVoiceBtn tap" onClick={tryVoice} aria-label="Voice input">
            <Icon>🎙</Icon>
          </button>
        )}
      </div>

      <TabBar />
    </div>
  );
}