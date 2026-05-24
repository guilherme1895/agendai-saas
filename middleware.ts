import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? "agendai-dev-secret-change-in-production"
);

// Rotas que exigem autenticação
const PROTECTED = ["/dashboard"];

// Rotas que autenticados não devem ver (login/register)
const AUTH_ONLY = ["/auth/login", "/auth/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAuthOnly  = AUTH_ONLY.some((p) => pathname.startsWith(p));

  // Lê o token do cookie
  const token = req.cookies.get("agendai_token")?.value ?? null;

  let isAuthenticated = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // Não autenticado tentando acessar rota protegida → login
  if (isProtected && !isAuthenticated) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Autenticado tentando acessar login/register → dashboard
  if (isAuthOnly && isAuthenticated) {
    const dashUrl = req.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.searchParams.delete("callbackUrl");
    return NextResponse.redirect(dashUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Roda apenas nas rotas relevantes — exclui _next, assets e APIs
  matcher: [
    "/dashboard/:path*",
    "/auth/login",
    "/auth/register",
  ],
};
