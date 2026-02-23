import { apiFetch } from "./client";

export type ChatRequest = {
  message: string;      
  sessionId: string;   
};

export type AiResponse = {
  response: string;
  data?: Array<{ label: string; value: string | number | boolean | null }> | null;
  meta?: { intent?: "sql" | "chat"; sql?: string | null; user_id?: string };
};

export async function chat(payload: ChatRequest, userId?: string, signal?: AbortSignal) {
  return apiFetch<AiResponse>("/api/Ai/chat", {
    method: "POST",
    signal,
    headers: userId ? { "X-User-Id": userId } : {},
    body: JSON.stringify(payload),
  });
}
