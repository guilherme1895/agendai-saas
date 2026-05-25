import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);

export const db = global.__prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = db;
}

// Mantém compatibilidade — não precisa mais de initDB()
export async function initDB() {}