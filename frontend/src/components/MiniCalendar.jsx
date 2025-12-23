import React from "react";
import dayjs from "dayjs";

const DOT_COLORS = ["#8b5a2b", "#2aa198", "#3cb371", "#b58900", "#6c71c4"];
function hashToColorIndex(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % DOT_COLORS.length;
}

export default function MiniCalendar({
  year,
  monthIndex0,
  markedDates = [],
  selectedDateIso,
  onSelectDate,
}) {
  const first = dayjs(new Date(year, monthIndex0, 1));
  const startDow = first.day(); // 0 Sun .. 6 Sat
  const daysInMonth = first.daysInMonth();

  // Normalize marked dates into a Set of YYYY-MM-DD
  const marked = new Set(markedDates);
  const selected = selectedDateIso ? dayjs(selectedDateIso).format("YYYY-MM-DD") : null;

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)", fontSize: 12 }}>
        <span>{first.format("MMMM")}</span>
        <span>{first.format("YYYY")}</span>
      </div>

      <div
        style={{
          marginTop: 10,
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 8,
        }}
      >
        {["S","M","T","W","T","F","S"].map((d) => (
          <div key={d} style={{ color: "var(--muted)", fontSize: 11, textAlign: "center" }}>{d}</div>
        ))}

        {cells.map((d, idx) => {
          if (!d) return <div key={idx} />;

          const iso = dayjs(new Date(year, monthIndex0, d)).format("YYYY-MM-DD");
          const has = marked.has(iso);
          const dotColor = DOT_COLORS[hashToColorIndex(iso)];
          const isSelected = selected === iso;

          return (
            <button
              key={idx}
              style={{
                textAlign: "center",
                border: "none",
                background: "transparent",
                padding: "6px 0 4px",
                borderRadius: 10,
                color: "inherit",
                cursor: onSelectDate ? "pointer" : "default",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectDate && onSelectDate(iso);
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  width: 28,
                  height: 28,
                  margin: "0 auto",
                  borderRadius: 8,
                  display: "grid",
                  placeItems: "center",
                  background: isSelected ? "rgba(255,255,255,0.14)" : "transparent",
                  color: isSelected ? "white" : "inherit",
                  transition: "background 120ms ease, color 120ms ease",
                }}
              >
                {d}
              </div>
              <div style={{ height: 8, display: "grid", placeItems: "center" }}>
                {has && (
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 99,
                      background: dotColor,
                      opacity: 0.95,
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
