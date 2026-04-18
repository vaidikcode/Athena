"use client";

import { useState, useEffect, useCallback } from "react";
import type { SourceId } from "@/lib/mock/data";

const STORAGE_KEY = "athena_source_connections_v1";
const EVENT_NAME = "athena-source-connections-changed";

type ConnectionMap = Record<SourceId, boolean>;

const DEFAULTS: ConnectionMap = {
  notion:       true,
  slack:        true,
  "google-docs":true,
  browser:      true,
};

function load(): ConnectionMap {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<ConnectionMap>) };
  } catch {
    return DEFAULTS;
  }
}

function persist(map: ConnectionMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function useSourceConnections() {
  const [connections, setConnections] = useState<ConnectionMap>(DEFAULTS);

  useEffect(() => {
    setConnections(load());
    const handler = () => setConnections(load());
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const revoke = useCallback((id: SourceId) => {
    const next = { ...load(), [id]: false };
    persist(next);
    setConnections(next);
  }, []);

  const reconnect = useCallback((id: SourceId) => {
    const next = { ...load(), [id]: true };
    persist(next);
    setConnections(next);
  }, []);

  return { connections, revoke, reconnect };
}
