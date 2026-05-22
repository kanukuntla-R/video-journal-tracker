import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard.jsx";
import Stats from "./pages/Stats.jsx";
import Calendar from "./pages/Calendar.jsx";
import Journal from "./pages/Journal.jsx";
import Chatbot from "./pages/Chatbot.jsx";
import Integrations from "./pages/Integrations.jsx";
import Automations from "./pages/Automations.jsx";
import Auth from "./pages/Auth.jsx";

import { supabase } from "./services/supabaseClient.js";

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="page">Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/journal/:date" element={<Journal />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/automations" element={<Automations />} />

        <Route path="*" element={<div className="page">404</div>} />
      </Routes>
    </BrowserRouter>
  );
}
