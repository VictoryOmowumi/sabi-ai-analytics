import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronsDown, ChevronsUp } from "lucide-react";

import { chatStream } from "@/lib/api/ai";
import { getHistorySession } from "@/lib/api/history";
import { friendlyAiErrorMessage } from "@/lib/errors/ai";

import Header from "@/components/header/Header";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ChatInput from "@/components/chat/ChatInput";
import ChatLoadingSkeleton from "@/components/chat/ChatLoadingSkeleton";
import ChatEmptyState from "@/components/chat/ChatEmptyState";
import ChatMessageList from "@/components/chat/ChatMessageList";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { logout, user, loading: authLoading } = useAuth();

  const { messages, setMessages, sessionId, setSessionId, loadSession } =
    useChatState();

  const [loadingHistoryChat, setLoadingHistoryChat] = useState(false);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
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
  const hasStreamTokensRef = useRef(false);

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

  const getScrollViewport = useCallback(() => {
    return scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLElement | null;
  }, []);

  const pickScrollContainer = useCallback(
    (_direction: "up" | "down") => {
      const viewport = getScrollViewport();
      if (viewport) return viewport;
      return document.scrollingElement as HTMLElement | null;
    },
    [getScrollViewport],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const viewport = getScrollViewport();
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
        return;
      }
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages.length, sending, getScrollViewport]);

  useEffect(() => {
    const viewport = getScrollViewport();
    if (!viewport) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      return;
    }

    const update = () => {
      setCanScrollUp(viewport.scrollTop > 12);
      setCanScrollDown(
        viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 12,
      );
    };

    update();
    viewport.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [messages.length, sending, getScrollViewport]);

  const scrollToTop = () => {
    const container = pickScrollContainer("up");
    container?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    const container = pickScrollContainer("down");
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  };
  const requestedChatId = useMemo(
    () => (searchParams.get("chat") ?? "").trim(),
    [searchParams],
  );

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

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
  const canShare =
    messages.length > 0 &&
    sessionId !== "legacy" &&
    requestedChatId !== "legacy";
  const sharePath = canShare
    ? `/chat?chat=${encodeURIComponent(sessionId)}`
    : null;

  const stopGeneration = useCallback(() => {
    const active = activeRequestRef.current;
    if (!active) return;

    active.abort();
    activeRequestRef.current = null;
    sendingRef.current = false;
    setSending(false);
  }, []);

  const sendText = async (
    text: string,
    options: { appendUserMessage?: boolean } = {},
  ) => {
    const { appendUserMessage = true } = options;
    const clean = text.trim();
    if (!clean || sendingRef.current) return;

    const controller = new AbortController();
    activeRequestRef.current = controller;
    sendingRef.current = true;
    setError(null);
    setSending(true);
    setStreamStatus("Thinking...");
    hasStreamTokensRef.current = false;
    setMessages((prev: Msg[]) => {
      const next = [...prev];
      if (appendUserMessage) {
        next.push({ role: "user", content: clean });
      }
      next.push({ role: "assistant", content: "" });
      return next;
    });

    try {
      await chatStream(
        { message: clean, sessionId: sessionId || "" },
        {
          onStatus: (payload) => {
            const message =
              typeof payload.message === "string"
                ? payload.message
                : typeof payload.stage === "string"
                  ? payload.stage
                  : null;
            if (message && !hasStreamTokensRef.current)
              setStreamStatus(message);
          },
          onToken: (token) => {
            if (!token) return;
            if (!hasStreamTokensRef.current) {
              hasStreamTokensRef.current = true;
              setStreamStatus(null);
            }
            setMessages((prev: Msg[]) => {
              const next = [...prev];
              for (let i = next.length - 1; i >= 0; i--) {
                if (next[i].role === "assistant") {
                  next[i] = {
                    ...next[i],
                    content: `${next[i].content ?? ""}${token}`,
                  };
                  break;
                }
              }
              return next;
            });
          },
           onDone: (res) => {
             setStreamStatus(null);
             setMessages((prev: Msg[]) => {
              const next = [...prev];
              const mappedData = res.data
                ? res.data.map(
                    (d: {
                      label: string;
                      value: string | number | boolean | null;
                    }) => ({
                      label: d.label,
                      value: String(d.value ?? ""),
                    }),
                  )
                : undefined;
              for (let i = next.length - 1; i >= 0; i--) {
                if (next[i].role === "assistant") {
                  next[i] = {
                    ...next[i],
                    content: res.response ?? next[i].content ?? "",
                    data: mappedData,
                  };
                  break;
                }
              }
               return next;
             });

            // Optimistic history update: HistoryPanel listens to this and updates immediately.
            // Backend persists on stream completion (event: done), but UI should not wait for a refetch.
            try {
              const sid = sessionId || "";
              if (sid) {
                window.dispatchEvent(
                  new CustomEvent("chat-history-upsert", {
                    detail: {
                      sessionId: sid,
                      timestamp: new Date().toISOString(),
                      question: clean,
                      response: res.response ?? "",
                    },
                  }),
                );
              }
            } catch {
              // ignore
            }
           },
         },
         user?.userId,
         controller.signal,
      );
    } catch (e: unknown) {
      if (isAbortError(e)) return;

      setStreamStatus(null);
      setMessages((prev: Msg[]) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant" && !last.content.trim()) {
          next.pop();
        }
        return next;
      });
      console.error("[AI RAW ERROR]", e);
      setError(friendlyAiErrorMessage(e));
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        sendingRef.current = false;
        setSending(false);
        setStreamStatus(null);
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
      if (
        targetIndex < 0 ||
        targetIndex >= prev.length ||
        prev[targetIndex]?.role !== "user"
      ) {
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
    navigate("/chat", { replace: true });
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
      navigate("/login", { replace: true });
    } catch {
      setError("Failed to logout. Please try again.");
    }
  };

  const showLoadingSkeleton = authLoading || loadingHistoryChat;

  return (
    <div className="flex h-dvh overflow-hidden text-foreground">
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="z-10 shrink-0 border-b border-border/60 backdrop-blur">
          <Header
            user={user}
            onNewChat={onNewChat}
            onLogout={onLogout}
            sharePath={sharePath}
            canShare={canShare}
          />
        </div>

        <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0 px-4 py-2">
          <div className="mx-auto max-w-6xl space-y-4">
            {showLoadingSkeleton ? (
              <ChatLoadingSkeleton />
            ) : messages.length === 0 ? (
              <ChatEmptyState
                onPickTopic={(topic) => {
                  setInput(topic);
                  void sendText(topic);
                }}
              />
            ) : (
              <ChatMessageList
                messages={messages}
                editingIndex={editingIndex}
                editingValue={editingValue}
                onEditingValueChange={setEditingValue}
                onStartEdit={onStartEdit}
                onCancelEdit={onCancelEdit}
                onSaveEdit={onSaveEdit}
                onRegenerate={onRegenerate}
              />
            )}

            {sending && streamStatus && (
              <div className="text-sm text-muted-foreground animate-pulse">
                {streamStatus}
              </div>
            )}

            {error && (
              <div className="max-w-4xl w-full rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div ref={bottomRef} style={{ height: 1 }} />
          </div>
        </ScrollArea>

        {messages.length > 0 && (
          <div className="pointer-events-none fixed bottom-24 right-0 z-20 mr-2 hidden w-max flex-col gap-2 sm:flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={scrollToTop}
                  aria-label="Scroll to top"
                  // disabled={!canScrollUp}
                >
                  <ChevronsUp className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={6}>
                Scroll to top
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/90 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={scrollToBottom}
                  aria-label="Scroll to bottom"
                  // disabled={!canScrollDown}
                >
                  <ChevronsDown className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={6}>
                Scroll to bottom
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={(text) => {
            if (showLoadingSkeleton) return;
            const clean = text.trim();
            if (!clean || sendingRef.current) return;
            setInput("");
            void sendText(clean);
          }}
          onStop={stopGeneration}
          loading={sending}
          disabled={!canSend || editingIndex !== null || showLoadingSkeleton}
        />
      </div>
    </div>
  );
}
