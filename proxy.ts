import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED = ["/chat", "/history", "/settings"];
const AUTH_COOKIE = "sabi_ai_session";
const ALT_AUTH_COOKIE = "saia_token";
const LEGACY_AUTH_COOKIE = "token";

function isProtectedPath(pathname: string): boolean {
  return PROTECTED.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export default function proxy(req: NextRequest) {
  const isProtected = isProtectedPath(req.nextUrl.pathname);
  if (!isProtected) return NextResponse.next();

  const token =
    req.cookies.get(AUTH_COOKIE)?.value ??
    req.cookies.get(ALT_AUTH_COOKIE)?.value ??
    req.cookies.get(LEGACY_AUTH_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/history/:path*", "/settings/:path*"],
};
