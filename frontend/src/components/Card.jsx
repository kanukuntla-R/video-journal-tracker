import React from "react";

export default function Card({
  icon,
  accent = "white",
  title,
  value,
  metaTop,
  metaBottom,
  showChevron = true,
  miniBars = null,
  onClick,
}) {
  return (
    <div className={`card tap`} onClick={onClick} role="button" tabIndex={0}>
      <div className="cardRow">
        <div className="leftBlock">
          <div className="iconWrap" style={{ color: accent }}>
            {icon}
          </div>
          <div>
            <div className="title">{title}</div>
            <div className="value">{value}</div>
          </div>
        </div>

        <div className="meta">
          {metaTop && <div>{metaTop}</div>}
          {miniBars && (
            <div className="miniBars" style={{ color: accent }}>
              {miniBars.map((h, idx) => (
                <span
                  key={idx}
                  className={h.active ? "active" : ""}
                  style={{ height: `${h.height}px` }}
                />
              ))}
            </div>
          )}
          {metaBottom && <div style={{ marginTop: 8 }}>{metaBottom}</div>}
          {showChevron && <span className="chevron">›</span>}
        </div>
      </div>
    </div>
  );
}
