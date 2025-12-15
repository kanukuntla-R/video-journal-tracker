import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import Card from "../components/Card.jsx";
import TabBar from "../components/TabBar.jsx";
import MiniCalendar from "../components/MiniCalendar.jsx";
import { PlusIcon } from "../components/Icons.jsx";

export default function Dashboard() {
  const nav = useNavigate();

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
        value="Streak 7"
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
        value="6:20"
        accent="var(--purple)"
        metaTop="Avg"
        metaBottom="This week"
        miniBars={[
          { height: 10, active: false },
          { height: 18, active: true },
          { height: 12, active: false },
          { height: 16, active: false },
          { height: 9, active: false },
        ]}
        onClick={() => nav(`/journal/${now.format("YYYY-MM-DD")}`)}
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
