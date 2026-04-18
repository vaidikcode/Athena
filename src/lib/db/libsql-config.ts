import "server-only";

/** Shared libSQL client options for Drizzle + migrations (local file or Turso). */
export function getLibsqlClientOptions(): { url: string; authToken?: string } {
  const url = process.env.DATABASE_URL ?? "file:./phuko.db";
  const token = process.env.DATABASE_AUTH_TOKEN?.trim();
  if (!token) return { url };
  return { url, authToken: token };
}
