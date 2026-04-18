export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Run DB migrations on startup
  const { runMigrations } = await import("@/lib/db/migrate");
  await runMigrations();

  const { seedDemoCalendarEvents } = await import("@/lib/calendar/seed-demo-events");
  await seedDemoCalendarEvents().catch((err) => console.error("[seed] calendar demo events:", err));

  // In-process cron (setInterval) only makes sense on a long-lived Node server.
  // On Vercel, use visit-triggered jobs (`/api/jobs/visit`) instead.
  if (process.env.VERCEL !== "1" && process.env.CRON_ENABLED === "true") {
    const { start } = await import("@/lib/cron/scheduler");
    start();
  }
}
