/** Drizzle Kit CLI config — shape varies by drizzle-kit version; avoid strict `Config` typing so Next's typecheck passes. */
export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite" as const,
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./phuko.db",
  },
};
