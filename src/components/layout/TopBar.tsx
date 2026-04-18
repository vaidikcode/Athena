"use client";

import { useEffect, useState } from "react";

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const fmt = () =>
      setTime(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    fmt();
    const id = setInterval(fmt, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border bg-white px-5">
      <div>
        <h1 className="text-sm font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-xs text-ink-subtle">{subtitle}</p>}
      </div>
      <time className="font-mono text-xs text-ink-faint">{time}</time>
    </header>
  );
}
