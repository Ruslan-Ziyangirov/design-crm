import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// `prepare: false` — обязателен для Supabase transaction-pooler (порт 6543):
// PgBouncer в transaction mode не поддерживает server-side prepared statements.
// `max: 1` — ограничивает число физических соединений с пулером на один
// инстанс serverless-функции; сам пулер мультиплексирует их на реальные
// бэкенд-соединения Postgres.
const globalForDb = globalThis as unknown as { client?: ReturnType<typeof postgres> };

const client =
  globalForDb.client ?? postgres(connectionString, { prepare: false, max: 1 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

export const db = drizzle(client, { schema });
export { client };
