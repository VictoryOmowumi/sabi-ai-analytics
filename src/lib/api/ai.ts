import { apiFetch } from "./client";
import { API_BASE_URL } from "@/lib/constants/env";

export type ChatRequest = {
  message: string;      
  sessionId: string;   
};

export type AiResponse = {
  response: string;
  data?: Array<{ label: string; value: string | number | boolean | null }> | null;
  meta?: {
    intent?: "sql" | "chat";
    sql?: string | null;
    user_id?: string;
    render?: "insight_only" | "table_fallback" | "text_only";
  };
};

type StreamHandlers = {
  onStatus?: (payload: Record<string, unknown>) => void;
  onToken?: (token: string) => void;
  onDone?: (payload: AiResponse) => void;
};

function isAiDebugEnabled() {
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem("sabi_ai_debug");
    if (raw === "1" || raw === "true") return true;
    if (raw === "0" || raw === "false") return false;
  }
  if (typeof import.meta.env.VITE_AI_DEBUG === "string") {
    return import.meta.env.VITE_AI_DEBUG === "true";
  }
  return Boolean(import.meta.env.DEV);
}

function aiDebug(label: string, payload?: unknown) {
  if (!isAiDebugEnabled()) return;
  if (payload === undefined) {
    console.log(`[AI DEBUG] ${label}`);
    return;
  }
  console.log(`[AI DEBUG] ${label}`, payload);
}

export async function chat(payload: ChatRequest, userId?: string, signal?: AbortSignal) {
  aiDebug("chat request", { payload, userId: userId ?? null });
  const response = await apiFetch<AiResponse>("/api/Ai/chat", {
    method: "POST",
    signal,
    headers: userId ? { "X-User-Id": userId } : {},
    body: JSON.stringify(payload),
  });
  aiDebug("chat response", response);
  return response;
}

function parseSseEvent(rawEvent: string) {
  const lines = rawEvent.split("\n");
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  return { eventName, data: dataLines.join("\n") };
}

export async function chatStream(
  payload: ChatRequest,
  handlers: StreamHandlers,
  userId?: string,
  signal?: AbortSignal
) {
  aiDebug("chat stream request", { payload, userId: userId ?? null });
  const res = await fetch(`${API_BASE_URL}/api/Ai/chat/stream`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(userId ? { "X-User-Id": userId } : {}),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok || !res.body) {
    const msg = await res.text().catch(() => "");
    aiDebug("chat stream error response", { status: res.status, message: msg });
    throw new Error(msg || `Stream request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamedText = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const rawEvent of events) {
      const { eventName, data } = parseSseEvent(rawEvent);
      if (!data) continue;

      let payloadData: unknown = data;
      try {
        payloadData = JSON.parse(data);
      } catch {
        payloadData = data;
      }
      aiDebug(`stream event: ${eventName}`, payloadData);

      if (eventName === "status") {
        if (typeof payloadData === "object" && payloadData !== null) {
          handlers.onStatus?.(payloadData as Record<string, unknown>);
        }
        continue;
      }

      if (eventName === "token") {
        if (typeof payloadData === "object" && payloadData !== null && "text" in payloadData) {
          const token = String((payloadData as { text?: unknown }).text ?? "");
          streamedText += token;
          handlers.onToken?.(token);
        } else {
          const token = String(payloadData ?? "");
          streamedText += token;
          handlers.onToken?.(token);
        }
        continue;
      }

      if (eventName === "done") {
        aiDebug("stream assembled text", streamedText);
        aiDebug("stream done payload", payloadData);
        handlers.onDone?.(payloadData as AiResponse);
        continue;
      }

      if (eventName === "error") {
        const message =
          typeof payloadData === "object" && payloadData !== null && "message" in payloadData
            ? String((payloadData as { message?: unknown }).message ?? "Streaming failed")
            : "Streaming failed";
        aiDebug("stream error event", { message });
        throw new Error(message);
      }
    }
  }

  aiDebug("chat stream completed");
}
