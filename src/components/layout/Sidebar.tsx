"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Brain, PlaySquare, CalendarDays } from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/rules", label: "Rules", icon: BookOpen },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/runs", label: "Runs", icon: PlaySquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 200,
        minHeight: "100vh",
        background: "var(--surface-raised)",
        borderRight: "1px solid var(--surface-border)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 0",
        flexShrink: 0,
      }}
    >
      {/* Wordmark */}
      <div
        style={{
          padding: "0 20px 24px",
          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        <span
          className="mono"
          style={{ color: "var(--agent)", fontWeight: 600, fontSize: 15, letterSpacing: "0.04em" }}
        >
          PHUKO
        </span>
        <div style={{ color: "var(--ink-subtle)", fontSize: 10, marginTop: 2, letterSpacing: "0.06em" }}>
          LIFE OPERATING SYSTEM
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "12px 0" }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 20px",
                color: active ? "var(--ink)" : "var(--ink-subtle)",
                background: active ? "var(--surface-overlay)" : "transparent",
                borderLeft: active
                  ? "2px solid var(--agent)"
                  : "2px solid transparent",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                transition: "all 0.12s",
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Provider badge */}
      <div
        className="mono"
        style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--surface-border)",
          color: "var(--ink-faint)",
          fontSize: 11,
        }}
      >
        {process.env.NEXT_PUBLIC_LLM_PROVIDER ?? "gemini"}
      </div>
    </aside>
  );
}
