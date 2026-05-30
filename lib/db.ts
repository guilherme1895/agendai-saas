// ============================================================================
// AgendAI SaaS — Prisma Client Singleton (Prisma 7 + Supabase)
// ============================================================================
// Padrão singleton para evitar múltiplas instâncias do PrismaClient
// em ambiente de desenvolvimento (hot-reload do Next.js).
//
// Em Prisma 7, o driver adapter (@prisma/adapter-pg) é OBRIGATÓRIO.
// O import vem do diretório gerado (não mais de @prisma/client).
// ============================================================================

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";
import { Pool } from "pg";

// Extensão do globalThis para o singleton
const globalForPrisma = globalThis as unknown as {
  __prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // SSL obrigatório para Supabase
    ssl: { rejectUnauthorized: false },
    // Limite de conexões por instância serverless
    // Evita exaustão do pool no Supabase (max padrão: 60 conexões)
    max: process.env.NODE_ENV === "production" ? 2 : 5,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const db = globalForPrisma.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = db;
}

// Mantém compatibilidade com código existente
export async function initDB() {}