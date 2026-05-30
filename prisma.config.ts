// ============================================================================
// AgendAI SaaS — Prisma 7 Configuration
// ============================================================================
// Este arquivo centraliza a configuração do Prisma 7.
// Em Prisma 7, as URLs de banco vão AQUI (não no schema.prisma).
//
// IMPORTANT: Prisma 7 NÃO carrega .env automaticamente.
// O import "dotenv/config" no topo é OBRIGATÓRIO.
// ============================================================================

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // Caminho do schema
  schema: "prisma/schema.prisma",

  // Configuração do datasource
  datasource: {
    // DATABASE_URL → Transaction Pooler (porta 6543)
    // Usado para queries da aplicação em runtime (serverless-friendly)
    url: env("DATABASE_URL"),

    // DIRECT_URL → Session Pooler ou conexão direta (porta 5432)
    // Usado APENAS para migrations (prisma migrate) que precisam de conexão estável
    directUrl: env("DIRECT_URL"),
  },

  // Configuração de migrations
  migrations: {
    path: "prisma/migrations",
  },
});