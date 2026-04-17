import type { CSSProperties, ReactNode } from "react";

type Variant = "agent" | "user" | "success" | "warning" | "error" | "muted" | "running";

const VARIANT_STYLES: Record<Variant, CSSProperties> = {
  agent: { background: "rgba(5,150,105,0.1)", color: "var(--agent)", border: "1px solid rgba(5,150,105,0.25)" },
  user: { background: "rgba(148,163,184,0.08)", color: "var(--ink-muted)", border: "1px solid var(--surface-border)" },
  success: { background: "rgba(74,222,128,0.1)", color: "var(--status-success)", border: "1px solid rgba(74,222,128,0.2)" },
  warning: { background: "rgba(251,191,36,0.1)", color: "var(--status-warning)", border: "1px solid rgba(251,191,36,0.2)" },
  error: { background: "rgba(248,113,113,0.1)", color: "var(--status-error)", border: "1px solid rgba(248,113,113,0.2)" },
  muted: { background: "transparent", color: "var(--ink-subtle)", border: "1px solid var(--surface-border)" },
  running: { background: "rgba(5,150,105,0.08)", color: "var(--status-running)", border: "1px solid rgba(5,150,105,0.2)" },
};

export function Badge({
  children,
  variant = "muted",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className="mono"
      style={{
        ...VARIANT_STYLES[variant],
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
