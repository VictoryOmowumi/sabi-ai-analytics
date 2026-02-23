import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5240";

export async function GET() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("sabi_ai_session")?.value ??
    cookieStore.get("saia_token")?.value ??
    cookieStore.get("token")?.value;

  const cookie = token ? `sabi_ai_session=${token}` : "";

  const res = await fetch(`${API_BASE}/api/Auth/me`, {
    headers: { cookie },
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
