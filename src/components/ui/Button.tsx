import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { CSSProperties } from "react";

type Variant = "primary" | "ghost" | "danger";

const BASE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "7px 14px",
  borderRadius: 5,
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.12s",
  border: "none",
  outline: "none",
};

const VARIANTS: Record<Variant, CSSProperties> = {
  primary: {
    background: "var(--agent)",
    color: "#0a0f1e",
  },
  ghost: {
    background: "transparent",
    color: "var(--ink-muted)",
    border: "1px solid var(--surface-border)",
  },
  danger: {
    background: "rgba(248,113,113,0.12)",
    color: "var(--status-error)",
    border: "1px solid rgba(248,113,113,0.25)",
  },
};

export function Button({
  children,
  variant = "ghost",
  style,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <button
      style={{
        ...BASE,
        ...VARIANTS[variant],
        ...(disabled ? { opacity: 0.4, cursor: "not-allowed" } : {}),
        ...style,
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
