"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function JsonCollapse({
  data,
  label = "raw",
}: {
  data: unknown;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: 6 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="mono"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--ink-subtle)",
          fontSize: 11,
          padding: 0,
        }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {label}
      </button>

      {open && (
        <pre
          className="mono"
          style={{
            marginTop: 6,
            padding: 12,
            background: "var(--surface-overlay)",
            border: "1px solid var(--surface-border)",
            borderRadius: 5,
            fontSize: 11,
            color: "var(--ink-muted)",
            overflowX: "auto",
            maxHeight: 320,
            overflowY: "auto",
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
