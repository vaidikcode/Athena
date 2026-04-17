"use client";

import { useState, useEffect } from "react";

export function TopBar({ title }: { title: string }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const fmt = () =>
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        height: 48,
        borderBottom: "1px solid var(--surface-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "var(--surface-raised)",
        flexShrink: 0,
      }}
    >
      <span style={{ fontWeight: 500, fontSize: 14, color: "var(--ink)" }}>
        {title}
      </span>
      <span className="mono" style={{ color: "var(--ink-subtle)", fontSize: 12 }}>
        {time}
      </span>
    </div>
  );
}
