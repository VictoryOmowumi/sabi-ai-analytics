
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, Loader2, Pin, PinOff, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  archiveHistorySession,
  deleteHistorySession,
  getHistory,
  restoreHistorySession,
  type HistorySession,
} from "@/lib/api/history";
import { useChatState } from "../provider/ChatProvider";

type HistoryUpsertEventDetail = {
  sessionId: string;
  timestamp: string;
  question: string;
  response: string;
};

function getLastTimestamp(s: HistorySession) {
  const last = s.messages?.reduce((acc, m) => {
    const t = m.timestamp ? new Date(m.timestamp).getTime() : 0;
    return Math.max(acc, t);
  }, 0);
  return last ?? 0;
}

export default function HistoryPanel({
  view,
  pinned,
  onTogglePin,
  onRequestClose,
}: {
  view: "recent" | "archived";
  pinned: boolean;
  onTogglePin: () => void;
  onRequestClose: () => void;
}) {
  const navigate = useNavigate();
  const { loadSession, sessionId: activeSessionId, newChat } = useChatState();

  const [q, setQ] = useState("");
  const [items, setItems] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [mutatingSessionId, setMutatingSessionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HistorySession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const history = await getHistory(view === "archived" ? { archivedOnly: true } : {});
      setItems(history ?? []);
    } catch (e: unknown) {
      const message = e instanceof Error && e.message ? e.message : "Failed to load history.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    const handler = (ev: Event) => {
      if (view === "archived") return;
      const detail = (ev as CustomEvent<HistoryUpsertEventDetail>).detail;
      if (!detail?.sessionId) return;

      setItems((prev) => {
        const next = [...prev];
        const idx = next.findIndex((s) => s.sessionId === detail.sessionId);
        const title =
          detail.question && detail.question.length > 40
            ? `${detail.question.slice(0, 40)}...`
            : detail.question || "Untitled chat";

        const msg = {
          id: detail.timestamp,
          title,
          timestamp: detail.timestamp,
          question: detail.question,
          response: detail.response,
        };

        if (idx >= 0) {
          const existing = next[idx];
          next[idx] = { ...existing, messages: [...(existing.messages ?? []), msg] };
          return next;
        }

        next.push({ sessionId: detail.sessionId, messages: [msg] });
        return next;
      });
    };

    window.addEventListener("chat-history-upsert", handler as EventListener);
    return () => window.removeEventListener("chat-history-upsert", handler as EventListener);
  }, [view]);

  const filtered = useMemo(() => {
    const sorted = [...items].sort((a, b) => getLastTimestamp(b) - getLastTimestamp(a));

    if (!q.trim()) return sorted;

    const term = q.toLowerCase();
    return sorted.filter((s) =>
      (s.messages ?? []).some((m) => {
        const hay = `${m.title ?? ""} ${m.question ?? ""} ${m.response ?? ""}`.toLowerCase();
        return hay.includes(term);
      })
    );
  }, [items, q]);

  const onSelect = (s: HistorySession) => {
    if (mutatingSessionId === s.sessionId) return;

    loadSession(s);
    const targetPath =
      s.sessionId === "legacy"
        ? "/chat?chat=legacy"
        : `/chat?chat=${encodeURIComponent(s.sessionId)}`;
    navigate(targetPath);

    if (!pinned) onRequestClose();
  };

  const onArchive = async (s: HistorySession) => {
    if (s.sessionId === "legacy") return;

    setMutatingSessionId(s.sessionId);
    setError(null);
    try {
      await archiveHistorySession(s.sessionId);
      setItems((prev) => prev.filter((item) => item.sessionId !== s.sessionId));

      if (activeSessionId === s.sessionId) {
        newChat();
        navigate("/chat");
      }
    } catch (e: unknown) {
      const message = e instanceof Error && e.message ? e.message : "Failed to archive chat.";
      setError(message);
    } finally {
      setMutatingSessionId(null);
    }
  };

  const onDelete = async (s: HistorySession) => {
    if (s.sessionId === "legacy") return;

    setMutatingSessionId(s.sessionId);
    setError(null);
    try {
      await deleteHistorySession(s.sessionId);
      setItems((prev) => prev.filter((item) => item.sessionId !== s.sessionId));
      setDeleteTarget(null);
      toast.success("Chat deleted", {
        description: `"${getSessionTitle(s)}" was removed.`,
      });

      if (activeSessionId === s.sessionId) {
        newChat();
        navigate("/chat");
      }
    } catch (e: unknown) {
      const message = e instanceof Error && e.message ? e.message : "Failed to delete chat.";
      setError(message);
      toast.error("Delete failed", { description: message });
    } finally {
      setMutatingSessionId(null);
    }
  };

  const getSessionTitle = (s: HistorySession) => {
    const last = [...(s.messages ?? [])].sort(
      (a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime()
    )[0];

    return last?.title || last?.question || "Untitled chat";
  };

  const onRestore = async (s: HistorySession) => {
    if (s.sessionId === "legacy") return;

    setMutatingSessionId(s.sessionId);
    setError(null);
    try {
      await restoreHistorySession(s.sessionId);
      setItems((prev) => prev.filter((item) => item.sessionId !== s.sessionId));
    } catch (e: unknown) {
      const message = e instanceof Error && e.message ? e.message : "Failed to restore chat.";
      setError(message);
    } finally {
      setMutatingSessionId(null);
    }
  };

  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{view === "archived" ? "Archived Chats" : "History"}</div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={onTogglePin}
                aria-label={pinned ? "Unpin history panel" : "Pin history panel"}
              >
                {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              {pinned ? "Unpin" : "Pin"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search"
          className="h-9 bg-card/40"
        />
        <kbd className="rounded-md border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground">
          K
        </kbd>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">{view === "archived" ? "Archived" : "Recent"}</div>

      <ScrollArea className="mt-2 flex-1 pr-2 pb-2 overflow-y-auto">
        {error && (
          <div className="mb-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-2 text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground">
            {view === "archived" ? "No archived chats." : "No results."}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((s) => {
              const last = [...(s.messages ?? [])].sort(
                (a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime()
              )[0];

              const title = getSessionTitle(s);
              const isActive = s.sessionId === activeSessionId;
              const canManage = s.sessionId !== "legacy";
              const isMutating = mutatingSessionId === s.sessionId;

              return (
                <div
                  key={s.sessionId}
                  className={[
                    "group flex w-full items-start gap-2 rounded-xl p-1 text-sm transition",
                    "hover:bg-muted/40",
                    isActive ? "border border-border/50 bg-muted/30" : "border border-transparent",
                  ].join(" ")}
                >
                  <button
                    className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left"
                    onClick={() => onSelect(s)}
                    disabled={isMutating}
                  >
                    <div className="line-clamp-1">{title}</div>
                    {last?.timestamp && (
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(last.timestamp).toLocaleString()}
                      </div>
                    )}
                  </button>

                  {canManage && (
                    <div
                      className={[
                        "flex shrink-0 items-center gap-1 pt-1 transition-opacity",
                        isMutating
                          ? "opacity-100"
                          : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100",
                      ].join(" ")}
                    >
                      {view === "archived" ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => void onRestore(s)}
                                disabled={isMutating}
                                aria-label="Restore chat"
                              >
                                {isMutating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3 w-3" />
                                )}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6}>
                            Restore chat
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => void onArchive(s)}
                                disabled={isMutating}
                                aria-label="Archive chat"
                              >
                                {isMutating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Archive className="h-3 w-3" />
                                )}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6}>
                            Archive chat
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground hover:text-destructive bg-destructive/10 rounded hover:bg-destructive/20"
                              onClick={() => setDeleteTarget(s)}
                              disabled={isMutating}
                              aria-label="Delete chat"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6}>
                          Delete chat
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="mt-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
        SABI AI Analytics - Powered by SBC
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !mutatingSessionId) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete chat?</AlertDialogTitle>
              <AlertDialogDescription>
                This chat will be permanently deleted and cannot be undone.
                {deleteTarget ? (
                  <span className="mt-2 block">Chat: {getSessionTitle(deleteTarget)}</span>
                ) : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!mutatingSessionId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!deleteTarget || !!mutatingSessionId}
              onClick={(e) => {
                if (!deleteTarget || mutatingSessionId) {
                  e.preventDefault();
                  return;
                }
                e.preventDefault();
                void onDelete(deleteTarget);
              }}
            >
              {mutatingSessionId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
