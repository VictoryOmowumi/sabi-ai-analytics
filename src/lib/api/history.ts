import { apiFetch } from "./client";

export type HistoryMessage = {
  id: string;          // timestamp
  title: string;
  timestamp: string;
  question: string;
  response: string;
};

export type HistorySession = {
  sessionId: string;   // "legacy" or real sessionId
  messages: HistoryMessage[];
};

export type HistoryMutationResult = {
  sessionId: string;
  affectedFiles: number;
};

export type GetHistoryOptions = {
  includeArchived?: boolean;
  archivedOnly?: boolean;
};

export async function getHistory(options: GetHistoryOptions = {}) {
  const params = new URLSearchParams();
  if (options.includeArchived) params.set("includeArchived", "true");
  if (options.archivedOnly) params.set("archivedOnly", "true");

  const query = params.toString();
  const path = query ? `/api/ChatHistory?${query}` : "/api/ChatHistory";
  return apiFetch<HistorySession[]>(path);
}

export async function getHistorySession(
  sessionId: string,
  options: { includeArchived?: boolean } = {}
) {
  const params = new URLSearchParams();
  if (options.includeArchived === false) params.set("includeArchived", "false");

  const query = params.toString();
  const path = query
    ? `/api/ChatHistory/${encodeURIComponent(sessionId)}?${query}`
    : `/api/ChatHistory/${encodeURIComponent(sessionId)}`;

  return apiFetch<HistorySession>(path);
}

export async function archiveHistorySession(sessionId: string) {
  return apiFetch<HistoryMutationResult>(
    `/api/ChatHistory/${encodeURIComponent(sessionId)}/archive`,
    { method: "PATCH" }
  );
}

export async function deleteHistorySession(sessionId: string) {
  return apiFetch<HistoryMutationResult>(
    `/api/ChatHistory/${encodeURIComponent(sessionId)}`,
    { method: "DELETE" }
  );
}

export async function restoreHistorySession(sessionId: string) {
  return apiFetch<HistoryMutationResult>(
    `/api/ChatHistory/${encodeURIComponent(sessionId)}/restore`,
    { method: "PATCH" }
  );
}
