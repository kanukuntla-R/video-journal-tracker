import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import Card from "../components/Card.jsx";
import TabBar from "../components/TabBar.jsx";
import MiniCalendar from "../components/MiniCalendar.jsx";
import { PlusIcon } from "../components/Icons.jsx";
import { getAllJournals } from "../services/api.js";

export default function Dashboard() {
  const nav = useNavigate();
  const [journals, setJournals] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getAllJournals();
        if (alive && Array.isArray(data)) setJournals(data);
      } catch {
        if (alive) setJournals([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const derived = useMemo(() => {
    const durationByDay = new Map();
    for (const j of journals) {
      const d = j?.date;
      if (!d) continue;
      const prev = durationByDay.get(d) || 0;
      durationByDay.set(d, prev + Number(j?.duration || 0));
    }
    let streak = 0;
    for (let i = 0; i < 3650; i++) {
      const day = dayjs().subtract(i, "day").format("YYYY-MM-DD");
      const has = (durationByDay.get(day) || 0) > 0;
      if (!has) break;
      streak += 1;
    }
    const today = dayjs().format("YYYY-MM-DD");
    const todayDur = durationByDay.get(today) || 0;
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const day = dayjs().subtract(6 - i, "day").format("YYYY-MM-DD");
      return durationByDay.get(day) || 0;
    });
    const avgLast7 = last7.length ? Math.round(last7.reduce((a, b) => a + b, 0) / last7.length) : 0;
    return { streak, todayDur, avgLast7 };
  }, [journals]);

  // Mock “journal exists” dates for now (replace with real API data later)
  const markedDates = useMemo(() => {
    const now = dayjs();
    return [
      now.format("YYYY-MM-01"),
      now.format("YYYY-MM-03"),
      now.format("YYYY-MM-06"),
      now.format("YYYY-MM-10"),
    ];
  }, []);

  const now = dayjs();
  const y = now.year();
  const m0 = now.month();

  return (
    <div className="page">
      <div className="sectionTitle">Calendar</div>

      <div
        className="card tap"
        onClick={() => nav("/calendar")}
        role="button"
        tabIndex={0}
      >
        <div className="cardRow">
          <div>
            <div className="title">This month</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6 }}>
              {now.format("MMMM")}
            </div>
          </div>

          <div className="meta">
            <div>Today</div>
            <div style={{ marginTop: 8, fontWeight: 800, color: "white" }}>
              {now.format("D")}
            </div>
            <span className="chevron">›</span>
          </div>
        </div>

        <MiniCalendar year={y} monthIndex0={m0} markedDates={markedDates} />
      </div>

      <div className="sectionTitle">Dashboard</div>

      <Card
        title="Stats"
        value={`Streak ${derived.streak || 0}`}
        accent="var(--orange)"
        metaTop={now.format("MMM D")}
        metaBottom="Tap to open"
        miniBars={[
          { height: 8, active: false },
          { height: 14, active: false },
          { height: 20, active: true },
          { height: 12, active: false },
          { height: 16, active: false },
        ]}
        onClick={() => nav("/stats")}
        icon={<span style={{ fontWeight: 900 }}>🔥</span>}
      />

      <Card
        title="Journal duration"
        value={derived.todayDur ? `${Math.round(derived.todayDur / 60)} min` : "—"}
        accent="var(--purple)"
        metaTop="Today"
        metaBottom={derived.avgLast7 ? `Avg ${Math.round(derived.avgLast7 / 60)} min (7d)` : "This week"}
        miniBars={[
          { height: 10, active: false },
          { height: 18, active: true },
          { height: 12, active: false },
          { height: 16, active: false },
          { height: 9, active: false },
        ]}
        onClick={() => nav("/stats")}
        icon={<span style={{ fontWeight: 900 }}>⏱</span>}
      />

      <Card
        title="Automations"
        value="2 active"
        accent="var(--blue)"
        metaTop="Integrations"
        metaBottom="Manage"
        onClick={() => nav("/automations")}
        icon={<span style={{ fontWeight: 900 }}>⚙️</span>}
      />

      <button className="fab" onClick={() => nav(`/journal/${now.format("YYYY-MM-DD")}`)}>
        <PlusIcon />
        Create
      </button>

      <TabBar />
    </div>
  );
}
