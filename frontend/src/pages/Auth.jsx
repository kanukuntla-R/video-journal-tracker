import React, { useState } from "react";
import { supabase } from "../services/supabaseClient.js";

export default function Auth({ initialError = "" }) {
  const [mode, setMode] = useState("signin"); // "signin" or "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(""); // "email" or "google"
  const [errorMsg, setErrorMsg] = useState(initialError);
  const [message, setMessage] = useState("");

  async function handleEmailPassword(e) {
    e.preventDefault();

    setLoading(true);
    setLoadingType("email");
    setErrorMsg("");
    setMessage("");

    try {
      let result;

      if (mode === "signup") {
        result = await supabase.auth.signUp({
          email,
          password,
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }

      if (result.error) {
        setErrorMsg(result.error.message);
        return;
      }

      if (mode === "signup") {
        setMessage(
          "Account created. If email confirmation is turned off, you should be logged in automatically."
        );
      } else {
        setMessage("Signed in successfully.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setLoadingType("");
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setLoadingType("google");
    setErrorMsg("");
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      setLoadingType("");
    }

    // No finally here because successful Google login redirects away.
  }

  function switchMode() {
    setMode((currentMode) =>
      currentMode === "signin" ? "signup" : "signin"
    );
    setErrorMsg("");
    setMessage("");
    setPassword("");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg, #000)",
        color: "white",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          background: "var(--card, #161616)",
          borderRadius: 24,
          padding: 28,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 8 }}>
          Echo Mind
        </div>

        <div
          style={{
            color: "var(--muted, rgba(255,255,255,0.55))",
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          {mode === "signin"
            ? "Sign in to continue your journal."
            : "Create your account to start journaling."}
        </div>

        <form onSubmit={handleEmailPassword}>
          <label style={{ fontSize: 13, color: "var(--muted)" }}>
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            autoComplete="email"
            required
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              height: 50,
              marginTop: 6,
              marginBottom: 14,
              padding: "0 14px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "var(--card2, #1f1f1f)",
              color: "white",
              fontSize: 15,
              outline: "none",
            }}
          />

          <label style={{ fontSize: 13, color: "var(--muted)" }}>
            Password
          </label>
          <input
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            required
            minLength={6}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              height: 50,
              marginTop: 6,
              marginBottom: 14,
              padding: "0 14px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "var(--card2, #1f1f1f)",
              color: "white",
              fontSize: 15,
              outline: "none",
            }}
          />

          {errorMsg && (
            <div
              style={{
                color: "#ff8a8a",
                background: "rgba(255, 80, 80, 0.08)",
                border: "1px solid rgba(255, 80, 80, 0.2)",
                borderRadius: 12,
                padding: "10px 12px",
                marginBottom: 12,
                fontSize: 14,
              }}
            >
              {errorMsg}
            </div>
          )}

          {message && (
            <div
              style={{
                color: "#34C759",
                background: "rgba(52, 199, 89, 0.08)",
                border: "1px solid rgba(52, 199, 89, 0.2)",
                borderRadius: 12,
                padding: "10px 12px",
                marginBottom: 12,
                fontSize: 14,
              }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: 50,
              borderRadius: 14,
              border: "none",
              background:
                loading && loadingType === "email"
                  ? "rgba(255, 107, 53, 0.45)"
                  : "linear-gradient(135deg, #FF6B35, #FF6B9D)",
              color: "white",
              fontWeight: 800,
              fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              marginBottom: 14,
            }}
          >
            {loading && loadingType === "email"
              ? "Please wait..."
              : mode === "signin"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "6px 0 16px",
            color: "var(--muted, rgba(255,255,255,0.45))",
            fontSize: 13,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <span>or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            height: 50,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "transparent",
            color: "white",
            fontWeight: 800,
            fontSize: 15,
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>G</span>
          {loading && loadingType === "google"
            ? "Opening Google..."
            : "Continue with Google"}
        </button>

        <button
          type="button"
          onClick={switchMode}
          disabled={loading}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: "var(--muted, rgba(255,255,255,0.55))",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 14,
          }}
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
