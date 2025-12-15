// FILE: frontend/src/pages/Calendar.jsx
import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import TabBar from "../components/TabBar.jsx";
import { PlusIcon } from "../components/Icons.jsx";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// Small palette for “journal dot” colors (subtle)
const DOT_COLORS = ["#8b5a2b", "#2aa198", "#3cb371", "#b58900", "#6c71c4"];

function hashToColorIndex(str) {
  // Simple stable hash -> 0..DOT_COLORS.length-1
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % DOT_COLORS.length;
}

export default function Calendar() {
  const nav = useNavigate();

  // “Month we are currently viewing”
  const [viewMonth, setViewMonth] = useState(dayjs().startOf("month"));

  // “Selected day” (red circle)
  const [selectedDay, setSelectedDay] = useState(dayjs());

  // Slide direction for small transition on month change
  const [slideDir, setSlideDir] = useState(null); // "left" | "right" | null

  // Mock “journal exists” dates for now (same idea you used on Dashboard)
  // Later we’ll fetch these from backend.
  const markedDates = useMemo(() => {
    const now = dayjs();
    return new Set([
      now.format("YYYY-MM-01"),
      now.format("YYYY-MM-03"),
      now.format("YYYY-MM-06"),
      now.format("YYYY-MM-10"),
    ]);
  }, []);

  // Build 42 calendar cells: start from the Sunday before the 1st of the month.
  const cells = useMemo(() => {
    const start = viewMonth.startOf("month").startOf("week"); // Sunday
    return Array.from({ length: 42 }, (_, i) => start.add(i, "day"));
  }, [viewMonth]);

  function changeMonth(delta) {
    setSlideDir(delta > 0 ? "left" : "right");
    setViewMonth((m) => m.add(delta, "month"));
    // Clear the flag after the animation finishes
    setTimeout(() => setSlideDir(null), 220);
  }

  function goPrevMonth() {
    changeMonth(-1);
  }
  function goNextMonth() {
    changeMonth(1);
  }

  // Swipe detection (simple + beginner-friendly)
  const startXRef = useRef(null);
  function onPointerDown(e) {
    startXRef.current = e.clientX;
  }
  function onPointerUp(e) {
    if (startXRef.current == null) return;
    const dx = e.clientX - startXRef.current;
    startXRef.current = null;

    // threshold
    if (dx > 60) changeMonth(-1);
    if (dx < -60) changeMonth(1);
  }

  function openJournal(d) {
    const iso = d.format("YYYY-MM-DD");
    nav(`/journal/${iso}`);
  }

  return (
    <div
      className="page calendarPage"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* Top controls (pills) */}
      <div className="calendarTopRow">
        <button className="pillButton" onClick={() => nav(-1)}>
          {"<"} {viewMonth.format("YYYY")}
        </button>

        <div className="pillGroup">
          <button className="pillIcon" title="Options">
            ⋯
          </button>
          <button className="pillIcon" title="Search">
            🔍
          </button>
          <button
            className="pillIcon"
            title="Add journal"
            onClick={() => openJournal(selectedDay)}
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      {/* Month title */}
      <div className="calendarMonthTitle">{viewMonth.format("MMMM")}</div>

      {/* Weekday row */}
      <div className="weekdayRow">
        {WEEKDAYS.map((w) => (
          <div key={w} className="weekdayCell">
            {w}
          </div>
        ))}
      </div>

      {/* Month grid */}
      <div
        className="monthGrid"
        aria-label="Calendar month grid"
        key={viewMonth.format("YYYY-MM")}
        data-slide={slideDir || ""}
      >
        {cells.map((d) => {
          const iso = d.format("YYYY-MM-DD");
          const inMonth = d.month() === viewMonth.month();
          const isSelected = iso === selectedDay.format("YYYY-MM-DD");
          const hasJournal = markedDates.has(iso);

          const dotColor = DOT_COLORS[hashToColorIndex(iso)];

          return (
            <button
              key={iso}
              className={[
                "dayCell",
                inMonth ? "" : "otherMonth",
                isSelected ? "selected" : "",
              ].join(" ")}
              onClick={() => {
                setSelectedDay(d);
                openJournal(d); // tap opens that day’s journal (per spec)
              }}
            >
              <div className="dayNumber">{d.date()}</div>

              <div className="dayDotRow">
                {hasJournal && (
                  <span
                    className="dayDot"
                    style={{ background: dotColor }}
                    aria-label="Journal exists"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <TabBar />
    </div>
  );
}