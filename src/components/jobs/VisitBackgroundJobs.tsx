"use client";

import { useEffect, useRef } from "react";

const STORAGE_KEY = "phuko_visit_job_last_at";
const CLIENT_MIN_MS = 30 * 60 * 1000;

/**
 * After sign-in, pings the server once per session (throttled) so a hourly agent run
 * can be scheduled in the background — replaces in-process cron on Vercel.
 */
export function VisitBackgroundJobs() {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    try {
      const prev = sessionStorage.getItem(STORAGE_KEY);
      if (prev) {
        const t = Number(prev);
        if (Number.isFinite(t) && Date.now() - t < CLIENT_MIN_MS) return;
      }
    } catch {
      /* sessionStorage unavailable */
    }

    void fetch("/api/jobs/visit", { method: "POST", credentials: "same-origin" })
      .then(() => {
        try {
          sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* non-fatal */
      });
  }, []);

  return null;
}
