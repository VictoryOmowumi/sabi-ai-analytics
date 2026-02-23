"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Msg = {
  role: "user" | "assistant";
  content: string;
  data?: Array<{ label: string; value: string }>;
};

export type Session = {
  sessionId: string;
  messages?: Array<{ question?: string; response?: string }>;
};

const STORAGE_KEY = "sabi_chat_state_v1";

function newSessionId() {
  return crypto.randomUUID();
}

function getPersistedChatState(): { sessionId: string; messages: Msg[] } | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { sessionId?: string; messages?: Msg[] };
    if (!parsed?.sessionId || !Array.isArray(parsed.messages)) return null;

    return { sessionId: parsed.sessionId, messages: parsed.messages };
  } catch {
    return null;
  }
}

type ChatState = {
  sessionId: string;
  setSessionId: React.Dispatch<React.SetStateAction<string>>;
  messages: Msg[];
  setMessages: React.Dispatch<React.SetStateAction<Msg[]>>;
  newChat: () => void;
  loadSession: (s: Session) => void;
};

const Ctx = createContext<ChatState | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string>(() => {
    const saved = getPersistedChatState();
    return saved?.sessionId ?? newSessionId();
  });
  const [messages, setMessages] = useState<Msg[]>(() => {
    const saved = getPersistedChatState();
    return saved?.messages ?? [];
  });

  const newChat = useCallback(() => {
    setSessionId(newSessionId());
    setMessages([]);
  }, []);

  const loadSession = useCallback((s: Session) => {
    setSessionId(s.sessionId === "legacy" ? newSessionId() : s.sessionId);

    const thread: Msg[] = [];
    for (const m of s.messages ?? []) {
      if (m.question) thread.push({ role: "user", content: m.question });
      if (m.response) thread.push({ role: "assistant", content: m.response });
    }
    setMessages(thread);
  }, []);

  const value = useMemo(
    () => ({ sessionId, setSessionId, messages, setMessages, newChat, loadSession }),
    [sessionId, messages, newChat, loadSession]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sessionId,
        messages,
      })
    );
  }, [sessionId, messages]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChatState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useChatState must be used inside ChatProvider");
  return v;
}
