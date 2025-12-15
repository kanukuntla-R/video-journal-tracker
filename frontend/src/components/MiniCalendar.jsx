import React from "react";
import dayjs from "dayjs";

export default function MiniCalendar({ year, monthIndex0, markedDates = [] }) {
  const first = dayjs(new Date(year, monthIndex0, 1));
  const startDow = first.day(); // 0 Sun .. 6 Sat
  const daysInMonth = first.daysInMonth();

  // Normalize marked dates into a Set of YYYY-MM-DD
  const marked = new Set(markedDates);

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

          return (
            <div key={idx} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{d}</div>
              <div style={{ height: 8, display: "grid", placeItems: "center" }}>
                {has && (
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: 99,
                    background: "white",
                    opacity: 0.9
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
