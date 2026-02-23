import { apiFetch } from "./client";

export type UserInfo = {
  userId: string;
  username: string;
  displayName: string;
  name: string;
  email?: string;
  department?: string;
  title?: string;
  company?: string;
};

export type LoginRequest = { username: string; password: string };

export async function login(payload: LoginRequest) {
  return apiFetch("/api/Auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function me() {
  return apiFetch<UserInfo>("/api/Auth/me");
}