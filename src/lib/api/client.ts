import { API_BASE_URL } from "@/lib/constants/env";

const API_BASE = API_BASE_URL;

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    credentials: "include",
  });

  if (!res.ok) {
    let msg = "";

    try {
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = (await res.json()) as
          | { message?: string; detail?: string; title?: string; error?: string }
          | null;
        msg =
          body?.message ||
          body?.detail ||
          body?.title ||
          body?.error ||
          "";
      } else {
        msg = await res.text();
      }
    } catch {
      msg = "";
    }

    throw new Error(msg || `Request failed: ${res.status}`);
  }
  return res.json();
}
