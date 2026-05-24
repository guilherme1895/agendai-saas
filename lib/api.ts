import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./auth";
import { initDB } from "./db";

// ---------------------------------------------------------------------------
// Wrapper universal para route handlers
// Garante: DB inicializado, erros padronizados, sem try/catch repetido
// ---------------------------------------------------------------------------
type Handler<T = unknown> = (req: Request, ctx: T) => Promise<NextResponse | Response>;

export function apiHandler<T = unknown>(fn: Handler<T>): Handler<T> {
  return async (req, ctx) => {
    await initDB();
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: "Dados inválidos.", details: err.flatten().fieldErrors },
          { status: 422 }
        );
      }
      console.error("[API Error]", err);
      return NextResponse.json(
        { error: "Erro interno do servidor." },
        { status: 500 }
      );
    }
  };
}

// ---------------------------------------------------------------------------
// Helpers de resposta
// ---------------------------------------------------------------------------
export const ok = (data: unknown, status = 200) =>
  NextResponse.json(data, { status });

export const created = (data: unknown) => NextResponse.json(data, { status: 201 });
