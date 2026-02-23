import { API_BASE_URL } from "@/lib/constants/env";

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token?: string; // if your backend returns JWT
  expiresAt?: string;
};

export type UserInfo = {
  userId: string;
  username: string;
  displayName: string;
  name: string;
  email: string;
  department?: string;
  title?: string;
  company?: string;
};

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/Auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    // try to extract backend error message
    const text = await res.text().catch(() => "");
    throw new Error(text || "Login failed. Please check your credentials.");
  }

  return res.json();
}

export async function me(): Promise<UserInfo> {
  const res = await fetch(`${API_BASE_URL}/api/Auth/me`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}
