// FILE: frontend/src/pages/Calendar.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";

import TabBar from "../components/TabBar.jsx";
import { PlusIcon } from "../components/Icons.jsx";
import { getAllJournals, getJournalsByDate } from "../services/api.js";

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
  const [searchParams] = useSearchParams();

  const initialQueryDate = searchParams.get("date");
  const initialDay =
    initialQueryDate && dayjs(initialQueryDate).isValid()
      ? dayjs(initialQueryDate)
      : dayjs();

  // “Month we are currently viewing”
  const [viewMonth, setViewMonth] = useState(initialDay.startOf("month"));

  // “Selected day” (red circle)
  const [selectedDay, setSelectedDay] = useState(initialDay);

  // Slide direction for small transition on month change
  const [slideDir, setSlideDir] = useState(null); // "left" | "right" | null

  // Fetch real journal dates instead of mock data
  const [markedDates, setMarkedDates] = useState(new Set());
  const [loadingJournals, setLoadingJournals] = useState(true);
  const [dayJournals, setDayJournals] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayErr, setDayErr] = useState("");

  // Sync with ?date=YYYY-MM-DD if provided (e.g., from dashboard)
  useEffect(() => {
    const q = searchParams.get("date");
    if (!q) return;
    const parsed = dayjs(q);
    if (!parsed.isValid()) return;
    const currentIso = selectedDay.format("YYYY-MM-DD");
    const nextIso = parsed.format("YYYY-MM-DD");
    if (currentIso === nextIso) return;
    setSelectedDay(parsed);
    setViewMonth(parsed.startOf("month"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, selectedDay]);

  // Load journals whenever selectedDay changes
  useEffect(() => {
    if (!selectedDay) return;
    loadDayJournals(selectedDay);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  useEffect(() => {
    async function fetchJournalDates() {
      try {
        setLoadingJournals(true);
        const journals = await getAllJournals("anonymous"); // Replace with actual user_id if you have auth
        // Extract unique dates from journals
        const dates = new Set(journals.map(j => j.date));
        setMarkedDates(dates);
      } catch (error) {
        console.error("Failed to fetch journals:", error);
        // Keep empty set on error
      } finally {
        setLoadingJournals(false);
      }
    }
    fetchJournalDates();
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

  async function loadDayJournals(d) {
    const iso = d.format("YYYY-MM-DD");
    setDayLoading(true);
    setDayErr("");
    try {
      const list = await getJournalsByDate(iso);
      setDayJournals(Array.isArray(list) ? list : []);
    } catch (e) {
      setDayErr(e?.message || "Failed to load journals for this date");
      setDayJournals([]);
    } finally {
      setDayLoading(false);
    }
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
                loadDayJournals(d);
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

      {/* Selected day journal list */}
      <div className="statsCard" style={{ marginTop: 12 }}>
        <div className="sectionHeader" style={{ marginTop: 0 }}>
          Journals on {selectedDay.format("MMM D, YYYY")}
        </div>

        {dayLoading && <div className="insight">Loading journals…</div>}
        {!!dayErr && <div className="insight" style={{ color: "var(--orange)" }}>{dayErr}</div>}

        {!dayLoading && !dayErr && dayJournals.length === 0 && (
          <div className="insight" style={{ display: "grid", gap: 10 }}>
            <div>No journals found for this date.</div>
            <button
              className="pillButton"
              style={{
                justifySelf: "flex-start",
                background: "var(--blue)",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: 999,
              }}
              onClick={() => openJournal(selectedDay)}
            >
              Create journal for {selectedDay.format("MMM D")}
            </button>
          </div>
        )}

        {!dayLoading && !dayErr && dayJournals.length > 0 && (
          <div className="journalList" style={{ display: "grid", gap: 10 }}>
            {dayJournals.map((j) => (
              <div key={j._id || j.id || j.created_at} className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>
                      {j.summary ? j.summary.slice(0, 120) : "Journal entry"}
                      {j.summary && j.summary.length > 120 ? "…" : ""}
                    </div>
                    <div style={{ opacity: 0.8, fontSize: 13 }}>
                      {j.transcript ? j.transcript.slice(0, 120) : "Transcript unavailable"}
                      {j.transcript && j.transcript.length > 120 ? "…" : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 120 }}>
                    <div style={{ fontWeight: 700 }}>{Math.round((j.duration || 0) / 60)} min</div>
                    <div style={{ opacity: 0.7, fontSize: 12, color: "var(--purple)" }}>
                      {j.created_at ? dayjs(j.created_at).format("h:mm A") : selectedDay.format("MMM D")}
                    </div>
                  </div>
                </div>

                <div className="tagRow" style={{ marginTop: 8 }}>
                  <button
                    className="pillButton"
                    style={{
                      padding: "6px 10px",
                      background: "var(--purple)",
                      color: "white",
                      border: "none",
                    }}
                    onClick={() => nav(`/journal/${selectedDay.format("YYYY-MM-DD")}?id=${j._id || j.id || ""}`)}
                  >
                    Open journal
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TabBar />
    </div>
  );
}