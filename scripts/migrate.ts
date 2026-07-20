import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL/DATABASE_URL is not set");
}

const migrationClient = postgres(connectionString, { max: 1 });
const db = drizzle(migrationClient);

async function main() {
  console.log("Применяю миграции...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Готово. База данных обновлена.");
  await migrationClient.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
