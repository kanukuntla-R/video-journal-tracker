import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

import TabBar from "../components/TabBar.jsx";
import { getAllJournals } from "../services/api.js";

/** -------- tiny helpers (format + math) -------- */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatSecondsToMin(sec) {
  const s = Number(sec || 0);
  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function trendLabel(nowValue, baselineValue) {
  if (baselineValue <= 0 && nowValue > 0) return "Up";
  if (baselineValue <= 0 && nowValue <= 0) return "Flat";
  const ratio = nowValue / baselineValue;
  if (ratio >= 1.15) return "Higher";
  if (ratio <= 0.85) return "Lower";
  return "Typical";
}

/** -------- Apple-Health style trend chart (thin bars + avg line) -------- */
function TrendChart({ values = [], labels = [], accent = "var(--orange)", onBarClick }) {
  // fixed canvas size; svg scales to container
  const W = 320;
  const H = 92; // slightly shorter (more like Apple cards)
  const pad = 10;

  const maxV = Math.max(1, ...values);
  const avg = mean(values);

  const slotW = values.length ? (W - pad * 2) / values.length : 10;

  // thin bars like Apple Health
  const barW = clamp(slotW * 0.34, 2.5, 7);

  const yFor = (v) => {
    const t = v / maxV; // 0..1
    return pad + (H - pad * 2) * (1 - t);
  };

  const avgY = yFor(avg);
  const [hoverIdx, setHoverIdx] = useState(null);

  return (
    <div
      className="chartWrap"
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        marginTop: 12,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: 12,
        position: "relative",
      }}
    >
      <svg
        width="100%"
        height="92"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Trend chart"
        style={{ display: "block" }}
        preserveAspectRatio="none"
      >
        {/* subtle vertical grid every 7 bars (weekly rhythm) */}
        {values.map((_, i) => {
          if (i % 7 !== 0) return null;
          const x = pad + i * slotW + slotW / 2;
          return (
            <line
              key={`g-${i}`}
              x1={x}
              x2={x}
              y1={pad}
              y2={H - pad}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
              strokeDasharray="3 6"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}

        {/* bars (soft gray, thin, rounded) */}
        {values.map((v, i) => {
          const x = pad + i * slotW + (slotW - barW) / 2;
          const y = yFor(v);
          const h = Math.max(1, H - pad - y);
          const label = labels[i] || `Item ${i + 1}`;
          const isHover = hoverIdx === i;

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={barW / 2}
              fill={isHover ? accent : "rgba(255,255,255,0.28)"}
              style={{ cursor: onBarClick ? "pointer" : "default", transition: "fill 120ms ease" }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              onClick={onBarClick ? () => onBarClick(label, v, i) : undefined}
            >
              <title>
                {label} • {formatSecondsToMin(v)}
              </title>
            </rect>
          );
        })}

        {/* Apple-style: single average line across */}
        <line
          x1={pad}
          x2={W - pad}
          y1={avgY}
          y2={avgY}
          stroke={accent}
          strokeWidth="3"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity="0.95"
        />

        {/* optional tiny "Average" label on left (very subtle) */}
        <text
          x={pad}
          y={Math.max(pad + 10, avgY - 8)}
          fill="rgba(255,255,255,0.45)"
          fontSize="9"
          fontWeight="700"
        >
          Average
        </text>
      </svg>

      {hoverIdx !== null && values[hoverIdx] !== undefined && (
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 8,
            fontSize: 10,
            fontWeight: 700,
            color: "white",
            padding: "4px 8px",
            background: "rgba(0,0,0,0.45)",
            borderRadius: 10,
            pointerEvents: "none",
          }}
        >
          {labels[hoverIdx] || `Item ${hoverIdx + 1}`} • {formatSecondsToMin(values[hoverIdx])}
        </div>
      )}
    </div>
  );
}

/** -------- small “metric icon” blocks (emoji-based, fast + clean) -------- */
function MetricIcon({ accent, children }) {
  return (
    <div className="metricIcon" style={{ color: accent }}>
      <span style={{ fontWeight: 900 }}>{children}</span>
    </div>
  );
}

export default function Stats() {
  const nav = useNavigate();

  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErr("");
        const data = await getAllJournals();
        if (!alive) return;
        setJournals(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load journals");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  /** Build “duration per day” + “sessions per day” maps */
  const derived = useMemo(() => {
    const durationByDay = new Map(); // YYYY-MM-DD -> seconds
    const sessionsByDay = new Map();
    const allDurations = [];

    for (const j of journals) {
      const d = j?.date;
      if (!d) continue;

      allDurations.push(Number(j?.duration || 0));

      const prevDur = durationByDay.get(d) || 0;
      const prevSes = sessionsByDay.get(d) || 0;

      durationByDay.set(d, prevDur + Number(j?.duration || 0));
      sessionsByDay.set(d, prevSes + 1);
    }

    const today = dayjs().format("YYYY-MM-DD");

    // streak = consecutive days ending today where duration > 0
    let streak = 0;
    for (let i = 0; i < 3650; i++) {
      const day = dayjs().subtract(i, "day").format("YYYY-MM-DD");
      const has = (durationByDay.get(day) || 0) > 0;
      if (!has) break;
      streak += 1;
    }

    // last N days arrays
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const day = dayjs().subtract(29 - i, "day").format("YYYY-MM-DD");
      return durationByDay.get(day) || 0;
    });
    const last30Dates = Array.from({ length: 30 }, (_, i) =>
      dayjs().subtract(29 - i, "day").format("YYYY-MM-DD")
    );

    const last21 = Array.from({ length: 21 }, (_, i) => {
      const day = dayjs().subtract(20 - i, "day").format("YYYY-MM-DD");
      return durationByDay.get(day) || 0;
    });
    const last21Dates = Array.from({ length: 21 }, (_, i) =>
      dayjs().subtract(20 - i, "day").format("YYYY-MM-DD")
    );

    // longest streak (all time)
    let longestStreak = 0;
    let current = 0;
    for (let i = 0; i < 3650; i++) {
      const day = dayjs().subtract(i, "day").format("YYYY-MM-DD");
      const has = (durationByDay.get(day) || 0) > 0;
      if (has) {
        current += 1;
        longestStreak = Math.max(longestStreak, current);
      } else {
        current = 0;
      }
    }

    const todayDur = durationByDay.get(today) || 0;
    const avgDaily30 = mean(last30);
    const medianDur = median(allDurations);
    const minDur = allDurations.length ? Math.min(...allDurations) : 0;
    const maxDur = allDurations.length ? Math.max(...allDurations) : 0;

    // weekly: this week(7 days) vs previous week(7 days) baseline
    const this7 = Array.from({ length: 7 }, (_, i) => {
      const day = dayjs().subtract(6 - i, "day").format("YYYY-MM-DD");
      return durationByDay.get(day) || 0;
    });
    const this7Dates = Array.from({ length: 7 }, (_, i) =>
      dayjs().subtract(6 - i, "day").format("YYYY-MM-DD")
    );
    const prev7 = Array.from({ length: 7 }, (_, i) => {
      const day = dayjs().subtract(13 - i, "day").format("YYYY-MM-DD");
      return durationByDay.get(day) || 0;
    });

    const thisWeekDur = sum(this7);
    const prevWeekDur = sum(prev7);

    // monthly sessions: current month vs last month
    const startThisMonth = dayjs().startOf("month");
    const startLastMonth = dayjs().subtract(1, "month").startOf("month");
    const endLastMonth = startThisMonth.subtract(1, "day").endOf("day");

    let thisMonthSessions = 0;
    let lastMonthSessions = 0;
    let entriesThisYear = 0;
    let entriesThisWeek = 0;
    let entriesThisMonth = 0;

    for (const j of journals) {
      const d = dayjs(j?.date);
      if (!d.isValid()) continue;

      if (d.isSame(dayjs(), "week")) entriesThisWeek += 1;
      if (d.isSame(dayjs(), "month")) entriesThisMonth += 1;
      if (d.isSame(dayjs(), "year")) entriesThisYear += 1;

      if (d.isSame(startThisMonth, "month")) thisMonthSessions += 1;
      if (d.isSame(startLastMonth, "month")) lastMonthSessions += 1;
      // note: simple month compare is enough for your UI right now
    }

    // yearly duration: this year vs last year
    const thisYear = dayjs().year();
    const lastYear = thisYear - 1;

    let thisYearDur = 0;
    let lastYearDur = 0;

    for (const [day, sec] of durationByDay.entries()) {
      const y = dayjs(day).year();
      if (y === thisYear) thisYearDur += sec;
      if (y === lastYear) lastYearDur += sec;
    }

    // consistency over last 30 days
    const daysWithEntries30 = last30.filter((v) => v > 0).length;
    const consistency30 = (daysWithEntries30 / 30) * 100;
    const missedDays30 = 30 - daysWithEntries30;

    return {
      durationByDay,
      sessionsByDay,
      today,
      streak,
      longestStreak,
      last21,
      last21Dates,
      last30,
      last30Dates,
      this7,
      this7Dates,
      todayDur,
      avgDaily30,
      medianDur,
      minDur,
      maxDur,
      thisWeekDur,
      prevWeekDur,
      thisMonthSessions,
      lastMonthSessions,
      entriesThisWeek,
      entriesThisMonth,
      entriesThisYear,
      thisYear,
      lastYear,
      thisYearDur,
      lastYearDur,
      startThisMonth,
      startLastMonth,
      consistency30,
      missedDays30,
    };
  }, [journals]);

  /** Accents (from your theme mapping) */
  const ACCENT = {
    streak: "var(--orange)",
    duration: "var(--purple)",
    progress: "var(--blue)",
    goals: "var(--green)",
    brain: "var(--cyan)",
  };

  /** --------- copy (insight sentences) --------- */
  const trendWord = trendLabel(derived.thisWeekDur, derived.prevWeekDur);
  const trendRight =
    trendWord === "Higher"
      ? "Higher vs last week"
      : trendWord === "Lower"
      ? "Lower vs last week"
      : "Steady vs last week";

  const dailyWord = trendLabel(derived.todayDur, derived.avgDaily30);
  const dailyTrendRight =
    dailyWord === "Higher"
      ? "Higher vs average"
      : dailyWord === "Lower"
      ? "Lower vs average"
      : "Typical vs average";
  const dailyInsight =
    dailyWord === "Higher"
      ? "Today’s journaling time is higher than your daily average."
      : dailyWord === "Lower"
      ? "Today’s journaling time is lower than your daily average."
      : "Today looks typical compared to your daily average.";

  const weeklyInsight =
    trendWord === "Higher"
      ? "Over the last 7 days, you spent more time journaling than the week before."
      : trendWord === "Lower"
      ? "Over the last 7 days, you spent less time journaling than the week before."
      : "Your last 7 days look steady compared to the previous week.";

  const monthWord = trendLabel(derived.thisMonthSessions, derived.lastMonthSessions);
  const monthlyInsight =
    monthWord === "Higher"
      ? "So far this month, you’ve journaled more often than last month."
      : monthWord === "Lower"
      ? "So far this month, you’ve journaled less often than last month."
      : "This month looks similar to last month so far.";

  const yearWord = trendLabel(derived.thisYearDur, derived.lastYearDur);
  const yearlyInsight =
    yearWord === "Higher"
      ? "This year’s journaling time is higher than last year’s."
      : yearWord === "Lower"
      ? "This year’s journaling time is lower than last year’s."
      : "This year looks similar to last year so far.";

  return (
    <div className="page statsPage">
      <div className="sectionTitle">Stats</div>

      {loading && <div className="card">Loading stats…</div>}
      {!!err && <div className="card">Error: {err}</div>}

      {!loading && !err && (
        <>
          <div className="sectionHeader">Trends</div>

          <div className="statsCard">
            <div className="metricRow">
              <MetricIcon accent={ACCENT.streak}>🔥</MetricIcon>
              <div className="metricName" style={{ color: ACCENT.streak }}>
                Streak
              </div>
            </div>

            <div className="insight">
              {derived.streak >= 3
                ? "You’re journaling more consistently than usual."
                : "A small streak starts fast — one entry today helps a lot."}
            </div>

            <div className="divider" />

            <div className="numbersRow">
              <div>
                <div className="bigNum">{derived.streak}</div>
                <div className="subLabel">days in a row</div>
                <div className="tagRow">
                  <span className="tagPill tagAccent">Longest {derived.longestStreak}</span>
                  <span className="tagPill">{derived.missedDays30} missed (30d)</span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div className="bigNum">{formatSecondsToMin(derived.thisWeekDur)}</div>
                <div className="subLabel">last 7 days</div>
                <div className="tagRow" style={{ justifyContent: "flex-end" }}>
                  <span className="tagPill">{derived.entriesThisWeek} entries</span>
                  <span className="tagPill">{derived.consistency30.toFixed(0)}% consistent</span>
                </div>
              </div>
            </div>

            <TrendChart values={derived.last21} labels={derived.last21Dates} accent={ACCENT.streak} />

            <div className="trendPill">
              <span>Trend</span>
              <span style={{ opacity: 0.9 }}>{trendRight}</span>
            </div>
          </div>

          <div className="sectionHeader">Daily Highlights</div>

          <div className="statsCard">
            <div className="metricRow">
              <MetricIcon accent={ACCENT.duration}>⏱</MetricIcon>
              <div className="metricName" style={{ color: ACCENT.duration }}>
                Journal duration
              </div>
            </div>

            <div className="insight">{dailyInsight}</div>

            <div className="divider" />

            <div className="numbersRow">
              <div>
                <div className="bigNum">{formatSecondsToMin(derived.todayDur)}</div>
                <div className="subLabel">today</div>
                <div className="tagRow">
                  <span
                    className="tagPill tagAccent"
                    style={{ borderColor: "rgba(255,255,255,0.08)", color: "white" }}
                  >
                    Today
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div className="bigNum">{formatSecondsToMin(derived.avgDaily30)}</div>
                <div className="subLabel">30-day average</div>
                <div className="tagRow" style={{ justifyContent: "flex-end" }}>
                  <span className="tagPill">Average</span>
                </div>
              </div>
            </div>

            <TrendChart values={derived.last30} labels={derived.last30Dates} accent={ACCENT.duration} />

            <div className="trendPill">
              <span>Trend</span>
              <span style={{ opacity: 0.9 }}>{dailyTrendRight}</span>
            </div>

            <div className="tagRow" style={{ marginTop: 10 }}>
              <span className="tagPill tagAccent">Median {formatSecondsToMin(derived.medianDur)}</span>
              <span className="tagPill">Min {formatSecondsToMin(derived.minDur)}</span>
              <span className="tagPill">Max {formatSecondsToMin(derived.maxDur)}</span>
            </div>
          </div>

          <div className="sectionHeader">Weekly Highlights</div>

          <div className="statsCard">
            <div className="metricRow">
              <MetricIcon accent={ACCENT.duration}>📊</MetricIcon>
              <div className="metricName" style={{ color: ACCENT.duration }}>
                Time spent
              </div>
            </div>

            <div className="insight">{weeklyInsight}</div>

            <div className="divider" />

            <div className="numbersRow">
              <div>
                <div className="bigNum">{formatSecondsToMin(derived.thisWeekDur)}</div>
                <div className="subLabel">this week</div>
                <div className="tagRow">
                  <span className="tagPill tagAccent">This week</span>
                  <span className="tagPill">{derived.entriesThisWeek} entries</span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div className="bigNum">{formatSecondsToMin(derived.prevWeekDur)}</div>
                <div className="subLabel">last week</div>
                <div className="tagRow" style={{ justifyContent: "flex-end" }}>
                  <span className="tagPill">Last week</span>
                  <span className="tagPill">{derived.entriesThisMonth} this month</span>
                </div>
              </div>
            </div>

            <TrendChart values={derived.this7} labels={derived.this7Dates} accent={ACCENT.duration} />

            <div className="trendPill">
              <span>Trend</span>
              <span style={{ opacity: 0.9 }}>{trendRight}</span>
            </div>
          </div>

          <div className="sectionHeader">Monthly Highlights</div>

          <div className="statsCard">
            <div className="metricRow">
              <MetricIcon accent={ACCENT.progress}>🗓</MetricIcon>
              <div className="metricName" style={{ color: ACCENT.progress }}>
                Sessions
              </div>
            </div>

            <div className="insight">{monthlyInsight}</div>

            <div className="divider" />

            <div className="numbersRow">
              <div>
                <div className="bigNum">{derived.thisMonthSessions}</div>
                <div className="subLabel">{derived.startThisMonth.format("MMMM")}</div>
                <div className="tagRow">
                  <span className="tagPill tagAccent">{derived.startThisMonth.format("MMM")}</span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div className="bigNum">{derived.lastMonthSessions}</div>
                <div className="subLabel">{derived.startLastMonth.format("MMMM")}</div>
                <div className="tagRow" style={{ justifyContent: "flex-end" }}>
                  <span className="tagPill">{derived.startLastMonth.format("MMM")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sectionHeader">Yearly Highlights</div>

          <div className="statsCard">
            <div className="metricRow">
              <MetricIcon accent={ACCENT.streak}>🏁</MetricIcon>
              <div className="metricName" style={{ color: ACCENT.streak }}>
                Total time
              </div>
            </div>

            <div className="insight">{yearlyInsight}</div>

            <div className="divider" />

            <div className="numbersRow">
              <div>
                <div className="bigNum">{formatSecondsToMin(derived.thisYearDur)}</div>
                <div className="subLabel">{derived.thisYear}</div>
                <div className="tagRow">
                  <span className="tagPill tagAccent">{derived.thisYear}</span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div className="bigNum">{formatSecondsToMin(derived.lastYearDur)}</div>
                <div className="subLabel">{derived.lastYear}</div>
                <div className="tagRow" style={{ justifyContent: "flex-end" }}>
                  <span className="tagPill">{derived.lastYear}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="statsCard tap showAllRow"
            role="button"
            tabIndex={0}
            onClick={() => nav("/calendar")}
          >
            <span>Show All Highlights</span>
            <span style={{ opacity: 0.8 }}>›</span>
          </div>
        </>
      )}

      <TabBar />
    </div>
  );
}