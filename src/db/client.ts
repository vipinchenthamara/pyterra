/**
 * SQLite connection. Singleton on globalThis so Turbopack HMR does not leak handles.
 * Migrations run lazily on first use, so `npm run dev` on a fresh clone just works.
 */
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema>;

const g = globalThis as unknown as { __architectDb?: Db; __architectSqlite?: Database.Database };

export function getDb(): Db {
  if (g.__architectDb) return g.__architectDb;
  const file = process.env.ARCHITECT_DB_PATH ?? path.resolve(process.cwd(), "data/architect.db");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
  g.__architectDb = db;
  g.__architectSqlite = sqlite;
  return db;
}

export function withTransaction<T>(fn: (db: Db) => T): T {
  const db = getDb();
  return db.transaction((tx) => fn(tx as unknown as Db));
}
