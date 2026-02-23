"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronsDown,
  ChevronsUp,
  Copy,
  RefreshCcw,
  ThumbsDown,
  ThumbsUp,
  X,
  Edit
} from "lucide-react";

import { me, type UserInfo } from "@/lib/api/auth";
import { chat } from "@/lib/api/ai";
import { getHistorySession } from "@/lib/api/history";

import Header from "@/components/header/Header";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatInput from "@/components/chat/ChatInput";
import SuggestedTopics from "@/components/topics/SuggestedTopics";
import MarkdownMessage from "@/components/chat/MarkdownMessage";
import { useChatState } from "@/components/provider/ChatProvider";
import { useAuth } from "@/components/provider/AuthProvider";

type Msg = {
  role: "user" | "assistant";
  content: string;
  data?: Array<{ label: string; value: string }>;
};

function newSessionId() {
  return crypto.randomUUID();
}

function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "AbortError"
  );
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logout } = useAuth();

  const { messages, setMessages, sessionId, setSessionId, loadSession } = useChatState();

  const [user, setUser] = useState<UserInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadingHistoryChat, setLoadingHistoryChat] = useState(false);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // auto-scroll
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const activeRequestRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    sendingRef.current = sending;
  }, [sending]);

  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
      sendingRef.current = false;
    };
  }, []);

  const getScrollContainers = () => {
    const containers: HTMLElement[] = [];
    const viewport = scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLElement | null;
    const main = scrollAreaRef.current?.closest("main") as HTMLElement | null;
    const doc = document.scrollingElement as HTMLElement | null;

    if (viewport) containers.push(viewport);
    if (main && main !== viewport) containers.push(main);
    if (doc && doc !== viewport && doc !== main) containers.push(doc);

    return containers;
  };

  const pickScrollContainer = (direction: "up" | "down") => {
    const metrics = getScrollContainers().map((container) => {
      const maxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
      const remaining = Math.max(0, maxScroll - container.scrollTop);
      return { container, maxScroll, remaining };
    });
    const scrollable = metrics.filter((m) => m.maxScroll > 1);
    if (scrollable.length === 0) {
      return metrics[0]?.container ?? null;
    }

    if (direction === "up") {
      return scrollable.sort((a, b) => b.container.scrollTop - a.container.scrollTop)[0].container;
    }

    return scrollable.sort((a, b) => b.remaining - a.remaining)[0].container;
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, sending]);

  useEffect(() => {
    const containers = getScrollContainers();
    if (containers.length === 0) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      return;
    }

    const update = () => {
      const states = containers.map((container) => ({
        canUp: container.scrollTop > 12,
        canDown: container.scrollTop + container.clientHeight < container.scrollHeight - 12,
      }));

      setCanScrollUp(states.some((s) => s.canUp));
      setCanScrollDown(states.some((s) => s.canDown));
    };

    update();
    containers.forEach((container) => {
      container.addEventListener("scroll", update, { passive: true });
    });
    window.addEventListener("resize", update);
    return () => {
      containers.forEach((container) => {
        container.removeEventListener("scroll", update);
      });
      window.removeEventListener("resize", update);
    };
  }, [messages.length, sending]);

  const scrollToTop = () => {
    const container = pickScrollContainer("up");
    container?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    const container = pickScrollContainer("down");
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  };
  const requestedChatId = useMemo(() => (searchParams.get("chat") ?? "").trim(), [searchParams]);

  // Auth guard
  useEffect(() => {
    setAuthLoading(true);
    me()
      .then((u) => setUser(u))
      .catch(() => router.replace("/login"))
      .finally(() => setAuthLoading(false));
  }, [router]);

  // ensure sessionId exists
  useEffect(() => {
    if (!sessionId) setSessionId(newSessionId());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!requestedChatId || requestedChatId === "legacy") {
      setLoadingHistoryChat(false);
      return;
    }

    let cancelled = false;
    setLoadingHistoryChat(true);
    setError(null);

    getHistorySession(requestedChatId, { includeArchived: true })
      .then((historySession) => {
        if (cancelled) return;
        loadSession(historySession);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Unable to load the selected chat.");
      })
      .finally(() => {
        if (!cancelled) setLoadingHistoryChat(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestedChatId, loadSession]);

  useEffect(() => {
    setError(null);
    setEditingIndex(null);
    setEditingValue("");
  }, [sessionId]);

  const canSend = useMemo(() => !!input.trim() && !sending, [input, sending]);
  const canShare = messages.length > 0 && sessionId !== "legacy" && requestedChatId !== "legacy";
  const sharePath = canShare ? `/chat?chat=${encodeURIComponent(sessionId)}` : null;

  const stopGeneration = useCallback(() => {
    const active = activeRequestRef.current;
    if (!active) return;

    active.abort();
    activeRequestRef.current = null;
    sendingRef.current = false;
    setSending(false);
  }, []);

  const sendText = async (text: string, options: { appendUserMessage?: boolean } = {}) => {
    const { appendUserMessage = true } = options;
    const clean = text.trim();
    if (!clean || sendingRef.current) return;

    const controller = new AbortController();
    activeRequestRef.current = controller;
    sendingRef.current = true;
    setError(null);
    setSending(true);

    if (appendUserMessage) {
      setMessages((prev: Msg[]) => [...prev, { role: "user", content: clean }]);
    }

    try {
      const res = await chat({ message: clean, sessionId: sessionId || "" }, user?.userId, controller.signal);

      // add assistant message with markdown response + structured data
      setMessages((prev: Msg[]) => [
        ...prev,
        {
          role: "assistant",
          content: res.response ?? "",
          data: res.data
            ? res.data.map((d: { label: string; value: string | number | boolean | null }) => ({
                label: d.label,
                value: String(d.value ?? ""),
              }))
            : undefined,
        },
      ]);
    } catch (e: unknown) {
      if (isAbortError(e)) return;

      if (typeof e === "object" && e !== null && "message" in e) {
        setError((e as { message?: string }).message || "Failed to get AI response.");
      } else {
        setError("Failed to get AI response.");
      }
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        sendingRef.current = false;
        setSending(false);
      }
    }
  };

  const onRegenerate = () => {
    // Find last user message from current state safely
    let lastUser: Msg | undefined;

    if (sendingRef.current) {
      stopGeneration();
    }

    setMessages((prev: Msg[]) => {
      const next = [...prev];

      // remove last assistant
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].role === "assistant") {
          next.splice(i, 1);
          break;
        }
      }

      // find last user (after removing assistant)
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].role === "user") {
          lastUser = next[i];
          break;
        }
      }

      return next;
    });

    // wait a tick then send (ensures lastUser captured)
    setTimeout(() => {
      if (lastUser?.content) {
        void sendText(lastUser.content, { appendUserMessage: false });
      }
    }, 0);
  };

  const onStartEdit = (index: number, content: string) => {
    setEditingIndex(index);
    setEditingValue(content);
    setError(null);
  };

  const onCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue("");
  };

  const onSaveEdit = () => {
    if (editingIndex === null) return;
    const clean = editingValue.trim();
    if (!clean) {
      setError("Message cannot be empty.");
      return;
    }

    const targetIndex = editingIndex;

    if (sendingRef.current) {
      stopGeneration();
    }

    // Rebuild thread from the edited user message forward.
    setMessages((prev: Msg[]) => {
      if (targetIndex < 0 || targetIndex >= prev.length || prev[targetIndex]?.role !== "user") {
        return prev;
      }

      const next = prev.slice(0, targetIndex + 1);
      next[targetIndex] = { ...next[targetIndex], content: clean };
      return next;
    });

    setEditingIndex(null);
    setEditingValue("");
    setError(null);
    void sendText(clean, { appendUserMessage: false });
  };

  const onNewChat = () => {
    if (sendingRef.current) {
      stopGeneration();
    }

    setSessionId(newSessionId());
    setMessages([]);
    setInput("");
    setError(null);
    setEditingIndex(null);
    setEditingValue("");
    router.replace("/chat");
  };

  const onLogout = async () => {
    setError(null);

    if (sendingRef.current) {
      stopGeneration();
    }

    try {
      await logout();
      setSessionId(newSessionId());
      setMessages([]);
      setInput("");
      setEditingIndex(null);
      setEditingValue("");
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Failed to logout. Please try again.");
    }
  };

  if (authLoading || loadingHistoryChat) {
    return (
      <div className="flex h-screen w-full items-center justify-center text-muted-foreground">
        Checking session...
      </div>
    );
  }

  return (
    <div className="flex h-screen text-foreground">
      <div className="relative flex flex-1 flex-col">
        <div className="sticky top-0 z-10 border-b border-border/60 backdrop-blur">
          <Header
            user={user}
            onNewChat={onNewChat}
            onLogout={onLogout}
            sharePath={sharePath}
            canShare={canShare}
          />
        </div>

        <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-6">
          <div className="mx-auto max-w-6xl space-y-4">
            {/* Empty state */}
            {messages.length === 0 ? (
              <div className="pt-16 text-center">
                <div className="text-4xl font-semibold tracking-tight text-foreground/90">
                  SABI Ai Analytics
                </div>
                <div className="mt-2 text-sm text-muted-foreground">Ask anything about your data.</div>

                <div className="mx-auto mt-6 max-w-3xl">
                  <SuggestedTopics
                    onPick={(t) => {
                      setInput(t);
                      void sendText(t);
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div
                    key={`${m.role}-${i}`}
                    className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
                  >
                    <div className="group relative max-w-[80%] rounded-2xl border border-border/60 bg-card/40 px-4 py-3 text-sm">
                      {m.role === "assistant" ? (
                        <>
                          <MarkdownMessage content={m.content} />

                          {/* show structured data */}
                          {m.data && m.data.length > 0 && (
                            <div className="mt-4 rounded-xl border border-border/60 bg-card/30 p-3">
                              <div className="mb-2 text-xs font-medium text-muted-foreground">Data</div>
                              <div className="space-y-1 text-xs">
                                {m.data.map((d, idx) => (
                                  <div
                                    key={`${d.label}-${idx}`}
                                    className="flex justify-between border-b border-border/30 pb-1 last:border-0 last:pb-0"
                                  >
                                    <span className="text-muted-foreground">{d.label}</span>
                                    <span className="font-medium">{String(d.value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* actions */}
                          <div className="mt-3 flex gap-3 text-muted-foreground">
                            <button
                              className="hover:text-foreground"
                              onClick={() => navigator.clipboard.writeText(m.content)}
                              title="Copy"
                            >
                              <Copy size={14} />
                            </button>

                            <button className="hover:text-foreground" onClick={onRegenerate} title="Regenerate">
                              <RefreshCcw size={14} />
                            </button>

                            <button className="hover:text-foreground" title="Helpful">
                              <ThumbsUp size={14} />
                            </button>

                            <button className="hover:text-foreground" title="Not helpful">
                              <ThumbsDown size={14} />
                            </button>
                          </div>
                        </>
                      ) : editingIndex === i ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingValue}
                            autoFocus
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                onSaveEdit();
                              }
                              if (e.key === "Escape") {
                                e.preventDefault();
                                onCancelEdit();
                              }
                            }}
                            className="min-h-20 w-full resize-y rounded-lg border border-border/60 bg-background/60 p-2 outline-none focus:ring-1 focus:ring-primary/60"
                          />
                          <div className="flex justify-end gap-2 text-muted-foreground">
                            <button
                              type="button"
                              className="rounded-md p-1 transition hover:bg-muted/40 hover:text-foreground"
                              onClick={onCancelEdit}
                              title="Cancel edit"
                            >
                              <X size={14} />
                            </button>
                            <button
                              type="button"
                              className="rounded-md p-1 transition hover:bg-muted/40 hover:text-foreground"
                              onClick={onSaveEdit}
                              title="Save and regenerate"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="whitespace-pre-wrap pr-8">{m.content}</div>
                          <button
                            type="button"
                            className="absolute right-2 top-10 rounded-md p-1 text-muted-foreground opacity-0 transition hover:bg-muted/40 hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100"
                            title="Edit message"
                            onClick={() => onStartEdit(i, m.content)}
                          >
                            <Edit size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {sending && <div className="text-sm text-muted-foreground">Thinking...</div>}

            {error && (
              <div className="max-w-4xl w-full rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {messages.length > 0 && (
          <div className="pointer-events-none sticky bottom-24 right-0 z-20 flex flex-col gap-2">
            <button
              type="button"
              className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              onClick={scrollToTop}
              aria-label="Scroll to top"
              title="Scroll to top"
              // disabled={!canScrollUp}
            >
              <ChevronsUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              onClick={scrollToBottom}
              aria-label="Scroll to bottom"
              title="Scroll to bottom"
              // disabled={!canScrollDown}
            >
              <ChevronsDown className="h-4 w-4" />
            </button>
          </div>
        )}

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={(text) => {
            const clean = text.trim();
            if (!clean || sendingRef.current) return;
            setInput("");
            void sendText(clean);
          }}
          onStop={stopGeneration}
          loading={sending}
          disabled={!canSend || editingIndex !== null}
        />
      </div>
    </div>
  );
}
