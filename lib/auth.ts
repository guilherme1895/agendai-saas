import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { db, initDB } from "./db";
import type { UserRow } from "./types";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? "agendai-dev-secret-change-in-production"
);

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------
export const hashPassword = (plain: string) => bcrypt.hash(plain, 12);
export const comparePassword = (plain: string, hash: string) =>
  bcrypt.compare(plain, hash);

// ---------------------------------------------------------------------------
// JWT
// ---------------------------------------------------------------------------
export interface SessionPayload {
  userId: string;
  email: string;
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Session helpers (server-side)
// ---------------------------------------------------------------------------
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get("agendai_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new ApiError(401, "Não autenticado.");
  return session;
}

export async function getCurrentUser(): Promise<UserRow | null> {
  const session = await getSession();
  if (!session) return null;
  await initDB();
  const result = await db.$queryRaw<UserRow[]>`SELECT * FROM users WHERE id = ${session.userId}`;
  return result?.[0] ?? null;
}

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export function setAuthCookie(res: Response, token: string) {
  res.headers.set(
    "Set-Cookie",
    `agendai_token=${token}; Path=/; Max-Age=${COOKIE_OPTS.maxAge}; HttpOnly; SameSite=Lax${COOKIE_OPTS.secure ? "; Secure" : ""}`
  );
}

// ---------------------------------------------------------------------------
// ApiError — lançado nas rotas e capturado pelo handler
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}
