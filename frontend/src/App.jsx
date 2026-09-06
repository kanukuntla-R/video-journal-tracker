import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard.jsx";
import Stats from "./pages/Stats.jsx";
import Calendar from "./pages/Calendar.jsx";
import Journal from "./pages/Journal.jsx";
import Recorder from "./pages/Recorder.jsx";
import Chatbot from "./pages/Chatbot.jsx";
import Integrations from "./pages/Integrations.jsx";
import Automations from "./pages/Automations.jsx";
import Auth from "./pages/Auth.jsx";

import { supabase } from "./services/supabaseClient.js";

const AUTH_BYPASS = import.meta.env.VITE_AUTH_BYPASS === "true";

export default function App() {
  const [session, setSession] = useState(
    AUTH_BYPASS ? { user: { id: "anonymous" } } : null
  );
  const [loading, setLoading] = useState(!AUTH_BYPASS);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (AUTH_BYPASS) return undefined;

    let alive = true;

    const timeoutId = window.setTimeout(() => {
      if (!alive) return;
      setAuthError("Auth check timed out. Check your Supabase frontend env values or network.");
      setLoading(false);
    }, 5000);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        setSession(data.session);
        setAuthError("");
      })
      .catch((err) => {
        if (!alive) return;
        setSession(null);
        setAuthError(err?.message || "Could not connect to auth.");
      })
      .finally(() => {
        if (!alive) return;
        window.clearTimeout(timeoutId);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      alive = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="page">Loading...</div>;
  }

  if (!session) {
    return <Auth initialError={authError} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/journal/:date" element={<Journal />} />
        <Route path="/record/:date" element={<Recorder />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/automations" element={<Automations />} />

        <Route path="*" element={<div className="page">404</div>} />
      </Routes>
    </BrowserRouter>
  );
}
