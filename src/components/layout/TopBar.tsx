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
    <header className="flex h-12 shrink-0 items-center justify-between border-b-[3px] border-black bg-nb-yellow px-5 shadow-[0px_3px_0px_0px_rgba(0,0,0,0.08)]">
      <div>
        <h1 className="text-sm font-black text-black">{title}</h1>
        {subtitle && <p className="text-xs font-bold text-black/50">{subtitle}</p>}
      </div>
      <time className="font-mono text-xs font-bold text-black/60">{time}</time>
    </header>
  );
}
