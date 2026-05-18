import React, { useState } from "react";
import { supabase } from "../services/supabaseClient.js";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // "idle" | "sent"
  const [errorMsg, setErrorMsg] = useState("");
  const [focused, setFocused] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
    setLoading(false);
  }

  function tryAgain() {
    setStatus("idle");
    setErrorMsg("");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg, #000)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "90%",
          height: "90%",
          background:
            "radial-gradient(ellipse at center, rgba(255, 107, 53, 0.18) 0%, rgba(167, 139, 250, 0.08) 40%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Subtle waveform backdrop */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "180px",
          opacity: 0.05,
          pointerEvents: "none",
          display: "flex",
          alignItems: "flex-end",
          gap: "3px",
          padding: "0 16px",
          zIndex: 0,
        }}
      >
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${15 + Math.abs(Math.sin(i * 0.35) + Math.cos(i * 0.18)) * 60}%`,
              background: "#fff",
              borderRadius: "2px",
            }}
          />
        ))}
      </div>

      {/* Main column */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "28px",
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 18px",
              borderRadius: "20px",
              background:
                "linear-gradient(135deg, #FF6B35 0%, #FF6B9D 50%, #A78BFA 100%)",
              display: "grid",
              placeItems: "center",
              position: "relative",
              boxShadow:
                "0 20px 50px -10px rgba(255, 107, 53, 0.4), 0 0 0 1px rgba(255,255,255,0.06) inset",
            }}
          >
            {/* Stylized "soundwave" mark */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="6" y1="10" x2="6" y2="14" />
              <line x1="10" y1="6" x2="10" y2="18" />
              <line x1="14" y1="8" x2="14" y2="16" />
              <line x1="18" y1="11" x2="18" y2="13" />
            </svg>
            {/* live dot */}
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#fff",
                animation: "emPulseDot 1.8s ease-out infinite",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "var(--text, #fff)",
              marginBottom: 8,
              lineHeight: 1,
            }}
          >
            Echo Mind
          </div>
          <div
            style={{
              fontSize: 15,
              color: "var(--muted, rgba(255,255,255,0.55))",
              fontWeight: 500,
            }}
          >
            Your second brain, on tape.
          </div>
        </div>

        {/* Auth card */}
        <div
          style={{
            width: "100%",
            background: "var(--card, #161616)",
            borderRadius: "24px",
            padding: "32px",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)",
          }}
        >
          {status === "sent" ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  margin: "0 auto 22px",
                  borderRadius: "50%",
                  background: "rgba(52, 199, 89, 0.12)",
                  border: "1px solid rgba(52, 199, 89, 0.25)",
                  display: "grid",
                  placeItems: "center",
                  animation: "emPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#34C759"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  marginBottom: 10,
                  letterSpacing: "-0.02em",
                }}
              >
                Check your inbox
              </div>
              <div
                style={{
                  color: "var(--muted, rgba(255,255,255,0.6))",
                  lineHeight: 1.55,
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                We sent a magic link to
                <br />
                <span
                  style={{
                    color: "var(--text, #fff)",
                    fontWeight: 700,
                  }}
                >
                  {email}
                </span>
                <br />
                Click it and you're in. No password required.
              </div>
              <button
                type="button"
                onClick={tryAgain}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "var(--text, #fff)",
                  padding: "11px 22px",
                  borderRadius: "999px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  marginBottom: 6,
                  letterSpacing: "-0.02em",
                }}
              >
                Sign in
              </div>
              <div
                style={{
                  color: "var(--muted, rgba(255,255,255,0.55))",
                  marginBottom: 22,
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                Enter your email — we'll send a magic link.
              </div>

              <form onSubmit={handleLogin} noValidate>
                <div style={{ position: "relative", marginBottom: 10 }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 16,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color:
                        focused || email
                          ? "#FF6B35"
                          : "rgba(255,255,255,0.35)",
                      pointerEvents: "none",
                      transition: "color 0.2s ease",
                      display: "flex",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    required
                    autoFocus
                    autoComplete="email"
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                      width: "100%",
                      height: "52px",
                      padding: "0 16px 0 46px",
                      borderRadius: "14px",
                      border: focused
                        ? "1px solid rgba(255, 107, 53, 0.6)"
                        : "1px solid rgba(255,255,255,0.08)",
                      background: "var(--card2, #1F1F1F)",
                      color: "white",
                      fontSize: 15,
                      fontWeight: 500,
                      outline: "none",
                      transition:
                        "border-color 0.2s ease, box-shadow 0.2s ease",
                      boxShadow: focused
                        ? "0 0 0 4px rgba(255, 107, 53, 0.12)"
                        : "none",
                    }}
                  />
                </div>

                {errorMsg && (
                  <div
                    style={{
                      background: "rgba(230, 57, 70, 0.08)",
                      border: "1px solid rgba(230, 57, 70, 0.25)",
                      color: "#FF8590",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      fontSize: 13,
                      fontWeight: 500,
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      lineHeight: 1.4,
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0, marginTop: 2 }}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" x2="12" y1="8" y2="12" />
                      <line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  style={{
                    width: "100%",
                    height: "52px",
                    borderRadius: "14px",
                    border: "none",
                    background:
                      loading || !email
                        ? "rgba(255, 107, 53, 0.35)"
                        : "linear-gradient(135deg, #FF6B35, #FF6B9D)",
                    color: "white",
                    fontWeight: 800,
                    fontSize: 15,
                    letterSpacing: "-0.005em",
                    cursor: loading || !email ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    boxShadow:
                      loading || !email
                        ? "none"
                        : "0 10px 30px -10px rgba(255, 107, 53, 0.55)",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && email)
                      e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {loading ? (
                    <>
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTopColor: "white",
                          borderRadius: "50%",
                          animation: "emSpin 0.7s linear infinite",
                        }}
                      />
                      Sending magic link...
                    </>
                  ) : (
                    <>
                      Send magic link
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              <div
                style={{
                  marginTop: 22,
                  paddingTop: 22,
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "var(--muted, rgba(255,255,255,0.42))",
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#34C759"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  No password
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#34C759"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Private by default
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#34C759"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Export anytime
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            fontSize: 12,
            color: "var(--muted, rgba(255,255,255,0.35))",
            textAlign: "center",
            fontWeight: 500,
            lineHeight: 1.6,
          }}
        >
          By signing in you agree to our{" "}
          <a
            href="#"
            style={{
              color: "rgba(255,255,255,0.6)",
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            Terms
          </a>{" "}
          and{" "}
          <a
            href="#"
            style={{
              color: "rgba(255,255,255,0.6)",
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            Privacy
          </a>
          .
        </div>
      </div>

      {/* Local keyframes */}
      <style>{`
        @keyframes emPulseDot {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.6); opacity: 1; }
          70% { box-shadow: 0 0 0 8px rgba(255,255,255,0); opacity: 0.5; }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); opacity: 1; }
        }
        @keyframes emSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes emPop {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        input::placeholder { color: rgba(255,255,255,0.35); }
      `}</style>
    </div>
  );
}