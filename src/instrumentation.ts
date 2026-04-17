export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Run DB migrations on startup
  const { runMigrations } = await import("@/lib/db/migrate");
  await runMigrations();

  // Start cron scheduler (HMR-safe singleton)
  const { start } = await import("@/lib/cron/scheduler");
  start();
}
