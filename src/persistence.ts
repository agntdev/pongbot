import initSqlJs from "sql.js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = "./data/pings.sqlite";

interface SqliteDb {
  run(sql: string, params?: unknown): void;
  exec(sql: string): { columns: string[]; values: unknown[][] }[];
  export(): Uint8Array;
}

let dbInit: Promise<SqliteDb> | null = null;

async function getDb(): Promise<SqliteDb> {
  if (dbInit) return dbInit;

  dbInit = (async () => {
    const SQL = await initSqlJs();
    let data: ArrayLike<number> | undefined;
    try {
      data = readFileSync(DB_PATH);
    } catch {
      // file does not exist yet
    }

    mkdirSync(dirname(DB_PATH), { recursive: true });
    const db = new SQL.Database(data) as unknown as SqliteDb;

    db.run(
      "CREATE TABLE IF NOT EXISTS counter (name TEXT PRIMARY KEY, count INTEGER NOT NULL)",
    );
    db.run("INSERT OR IGNORE INTO counter (name, count) VALUES ('pings', 0)");

    persist(db);
    return db;
  })();

  return dbInit;
}

function persist(db: SqliteDb): void {
  const data = db.export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

export async function incrementAndGetCount(): Promise<number> {
  const db = await getDb();
  db.run("BEGIN TRANSACTION");
  db.run("UPDATE counter SET count = count + 1 WHERE name = 'pings'");
  const results = db.exec("SELECT count FROM counter WHERE name = 'pings'");
  db.run("COMMIT");
  persist(db);

  const count = results[0]?.values[0]?.[0];
  if (typeof count !== "number") {
    throw new Error("counter row not found");
  }
  return count;
}

export async function getCount(): Promise<number> {
  const db = await getDb();
  const results = db.exec("SELECT count FROM counter WHERE name = 'pings'");
  const count = results[0]?.values[0]?.[0];
  if (typeof count !== "number") {
    return 0;
  }
  return count;
}