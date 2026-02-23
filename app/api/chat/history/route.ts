import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5240";

export async function GET() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("sabi_ai_session")?.value ?? cookieStore.get("saia_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const res = await fetch(`${API_BASE}/api/ChatHistory`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
