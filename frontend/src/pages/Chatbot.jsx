// FILE: frontend/src/pages/Chatbot.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import TabBar from "../components/TabBar.jsx";
import { BotIcon } from "../components/Icons.jsx";
import { chatWithBot } from "../services/api.js";

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function ChatSvg({ name }) {
  const paths = {
    arrowUp: <path d="M12 19V5m0 0-6 6m6-6 6 6" />,
    back: <path d="m15 18-6-6 6-6" />,
    check: <path d="m5 13 4 4L19 7" />,
    copy: (
      <>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <rect x="4" y="4" width="11" height="11" rx="2" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8.5" cy="10.5" r="1.5" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),
    message: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h6" />
        <path d="M16 3h.01M20 3h.01" />
      </>
    ),
    mic: (
      <>
        <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
        <path d="M19 11a7 7 0 0 1-14 0M12 19v4" />
      </>
    ),
    paperclip: <path d="m21.4 11.6-8.5 8.5a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 1 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />,
    plus: <path d="M12 5v14M5 12h14" />,
    refresh: <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />,
    telescope: (
      <>
        <path d="m10.5 6.5 7 3.8-2 3.7-7-3.8z" />
        <path d="m7 8.5-2.2 4.1 3.5 1.9 2.2-4.1M13 14l-4 7M17 15l2 6M10 19h7" />
      </>
    ),
    x: <path d="M18 6 6 18M6 6l12 12" />,
  };

  return (
    <svg className="chatSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export default function Chatbot() {
  const nav = useNavigate();
  const topic = useMemo(() => "Second Brain", []);
  const initialMessages = useMemo(() => [], []);

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const copyResetRef = useRef(null);
  const scrollerRef = useRef(null);
  const shouldPinRef = useRef(true);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !shouldPinRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    };
  }, []);

  function updateScrollIntent() {
    const el = scrollerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 80;
    shouldPinRef.current = isNearBottom;
    setShowJumpButton(!isNearBottom);
  }

  function scrollToLatest() {
    const el = scrollerRef.current;
    if (!el) return;
    shouldPinRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setShowJumpButton(false);
  }

  function resetConversation() {
    setMessages(initialMessages);
    setInput("");
    setToolsOpen(false);
    shouldPinRef.current = true;
  }

  function lastHistoryForApi(limit = 10) {
    return messages
      .filter((m) => !m.thinking)
      .slice(-limit)
      .map((m) => ({ role: m.role, content: m.text }));
  }

  async function sendText(text) {
    const clean = (text || "").trim();
    if (!clean || sending) return;

    const userMsg = { id: uid(), role: "user", text: clean, createdAt: Date.now() };
    const thinkingId = uid();

    shouldPinRef.current = true;
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: thinkingId, role: "assistant", text: "Thinking...", createdAt: Date.now(), thinking: true },
    ]);
    setInput("");
    setSending(true);
    setToolsOpen(false);

    try {
      const history = [...lastHistoryForApi(10), { role: "user", content: clean }];
      const res = await chatWithBot({ message: clean, history, user_id: "anonymous" });
      const reply = res?.reply || "I didn't get a reply. Try again?";
      setMessages((prev) =>
        prev.map((m) => (m.id === thinkingId ? { ...m, text: reply, thinking: false } : m))
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? {
                ...m,
                thinking: false,
                text:
                  "I couldn't reach the server.\n\nMake sure your backend is running on `http://127.0.0.1:8000` and the `/chat` endpoint is available.",
              }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText(input);
    }
  }

  async function copyText(text) {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text || "");
        return;
      }
    } catch {
      // Use the fallback below.
    }

    try {
      const ta = document.createElement("textarea");
      ta.value = text || "";
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {
      // Copy is a convenience action, so avoid noisy errors.
    }
  }

  function showCopied(messageId) {
    if (copyResetRef.current) clearTimeout(copyResetRef.current);
    setCopiedId(messageId);
    copyResetRef.current = setTimeout(() => setCopiedId(null), 1200);
  }

  function tryVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      window.alert("Voice input isn't supported in this browser yet.");
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

  const isEmpty = messages.length === 0;
  const canSend = input.trim().length > 0 && !sending;

  return (
    <div className="page chatPage">
      <section className="chatShell" aria-label="AI journal chat">
        <header className="chatCardHeader">
          <button className="chatIconButton tap" onClick={() => nav(-1)} aria-label="Back">
            <ChatSvg name="back" />
          </button>

          <div className="chatHeaderTitle">
            <BotIcon className="chatTitleIcon" size={20} />
            <div>
              <h1>New Chat</h1>
              <p>How can I help you today?</p>
            </div>
          </div>

          <button
            className="chatIconButton tap"
            onClick={resetConversation}
            disabled={sending}
            aria-label="Reset conversation"
            title="Reset"
          >
            <ChatSvg name="refresh" />
          </button>
        </header>

        <div className="chatCardBody">
          {isEmpty ? (
            <div className="chatEmpty">
              <div className="chatEmptyIcon">
                <ChatSvg name="message" />
              </div>
              <h2>Morning, journal.</h2>
              <p>Ask about patterns, goals, moments, or what changed across your recent entries.</p>
            </div>
          ) : (
            <div className="chatMessageScroller">
              <div
                className="chatScroller"
                ref={scrollerRef}
                onScroll={updateScrollIntent}
                role="log"
                aria-live="polite"
                aria-relevant="additions"
                aria-busy={sending}
              >
                {messages.map((m, idx) => {
                  const isAssistant = m.role === "assistant";
                  const isFirst = idx === 0;

                  return (
                    <article key={m.id} className={`chatMsgRow ${isAssistant ? "left" : "right"}`}>
                      {isFirst && (
                        <div className="chatTopicChipWrap">
                          <div className="chatTopicChip">{topic}</div>
                        </div>
                      )}

                      <div className={`chatMsg ${isAssistant ? "assistant" : "user"} ${m.thinking ? "thinking" : ""}`}>
                        <div className="chatMsgText">{m.text}</div>

                        {isAssistant && !m.thinking && (
                          <div className="chatActionRow">
                            <button
                              className="chatActionBtn tap"
                              onClick={async () => {
                                await copyText(m.text);
                                showCopied(m.id);
                              }}
                              title={copiedId === m.id ? "Copied" : "Copy"}
                              aria-label={copiedId === m.id ? "Copied" : "Copy message"}
                            >
                              <ChatSvg name={copiedId === m.id ? "check" : "copy"} />
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {showJumpButton && (
                <button className="chatJumpButton tap" type="button" onClick={scrollToLatest}>
                  Latest
                  <ChatSvg name="arrowUp" />
                </button>
              )}
            </div>
          )}
        </div>

        <footer className="chatCardFooter">
          <form
            className="chatInputGroup"
            onSubmit={(e) => {
              e.preventDefault();
              sendText(input);
            }}
          >
            <textarea
              className="chatInput"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask anything"
              rows={1}
            />

            <div className="chatInputActions">
              <div className="chatToolsWrap">
                <button
                  className="chatMiniButton tap"
                  aria-label="Add tools"
                  type="button"
                  onClick={() => setToolsOpen((open) => !open)}
                >
                  <ChatSvg name={toolsOpen ? "x" : "plus"} />
                </button>

                {toolsOpen && (
                  <div className="chatToolsMenu">
                    <button type="button">
                      <ChatSvg name="paperclip" />
                      Add Photos & Files
                    </button>
                    <button type="button">
                      <ChatSvg name="image" />
                      Create Image
                    </button>
                    <button type="button">
                      <ChatSvg name="telescope" />
                      Deep Research
                    </button>
                    <button type="button">
                      <ChatSvg name="globe" />
                      Web Search
                    </button>
                  </div>
                )}
              </div>

              {canSend ? (
                <button className="chatSendButton tap" type="submit" disabled={!canSend} aria-label="Send">
                  <ChatSvg name="arrowUp" />
                </button>
              ) : (
                <button className="chatMiniButton tap" type="button" onClick={tryVoice} aria-label="Voice input">
                  <ChatSvg name="mic" />
                </button>
              )}
            </div>
          </form>
        </footer>
      </section>

      <TabBar />
    </div>
  );
}
