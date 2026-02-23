import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("sabi_ai_session", "", { path: "/", maxAge: 0 });
  res.cookies.set("saia_token", "", { path: "/", maxAge: 0 });
  res.cookies.set("token", "", { path: "/", maxAge: 0 });
  return res;
}
