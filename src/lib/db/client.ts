import "server-only";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { getLibsqlClientOptions } from "./libsql-config";

type PhukoDb = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __phukoDb: PhukoDb | undefined;
}

const client = createClient(getLibsqlClientOptions());
export const db: PhukoDb =
  globalThis.__phukoDb ?? drizzle(client, { schema });
if (!globalThis.__phukoDb) globalThis.__phukoDb = db;
