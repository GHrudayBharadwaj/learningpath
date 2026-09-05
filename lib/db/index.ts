import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let pool: Pool | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (dbInstance) return dbInstance;

  const connectionString = process.env.DATABASE_URL;

  try {
    if (!pool && connectionString) {
      pool = new Pool({
        connectionString,
        ssl: connectionString.includes("sslmode=require") || connectionString.includes("neon.tech") 
          ? { rejectUnauthorized: false } 
          : false,
        max: 10,
        idleTimeoutMillis: 30000,
      });
    }

    if (pool) {
      dbInstance = drizzle(pool, { schema });
      return dbInstance;
    }
  } catch (err) {
    console.warn("PostgreSQL connection error, falling back to local storage adapter:", err);
  }

  return null;
}

export const db = getDb();
export * from "./schema";
