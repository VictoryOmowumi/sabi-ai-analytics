import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5240";

export async function POST(req: Request) {
  const body = await req.json();

  const res = await fetch(`${API_BASE}/api/Auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: body.username,
      password: body.password,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    return NextResponse.json(
      { message: msg || "Login failed" },
      { status: res.status }
    );
  }

  const data = await res.json(); // { token, user }

  const response = NextResponse.json({ user: data.user });

  response.cookies.set("sabi_ai_session", data.token, {
    httpOnly: true,
    secure: process.env.NEXT_PUBLIC_APP_ENV === "production", // set true in production https
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  // cleanup old cookie name if present
  response.cookies.set("saia_token", "", { path: "/", maxAge: 0 });

  return response;
}
