import {
  Check,
  Copy,
  Edit,
  RefreshCcw,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import MarkdownMessage from "@/components/chat/MarkdownMessage";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Msg = {
  role: "user" | "assistant";
  content: string;
  data?: Array<{ label: string; value: string }>;
};

type ChatMessageListProps = {
  messages: Msg[];
  editingIndex: number | null;
  editingValue: string;
  onEditingValueChange: (value: string) => void;
  onStartEdit: (index: number, content: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onRegenerate: () => void;
};

function formatDataValue(value: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return raw;

  const normalized = raw.replace(/,/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return raw;

  const n = Number(normalized);
  if (!Number.isFinite(n)) return raw;

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(n);
}

function toNumericValue(value: string) {
  const raw = String(value ?? "").trim().replace(/,/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function formatCompactNaira(value: number) {
  const compact = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
  return `₦${compact}`;
}

export default function ChatMessageList({
  messages,
  editingIndex,
  editingValue,
  onEditingValueChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRegenerate,
}: ChatMessageListProps) {
  return (
    <>
      {messages.map((m, i) => {
        if (
          m.role === "assistant" &&
          !m.content.trim() &&
          (!m.data || m.data.length === 0)
        ) {
          return null;
        }

        return (
          <div
            key={`${m.role}-${i}`}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div className="group relative max-w-[90%] rounded-2xl border border-border/60 bg-card/40 px-4 py-3 text-sm sm:max-w-[80%] lg:max-w-[70%]">
              {m.role === "assistant" ? (
                <>
                  <MarkdownMessage content={m.content} />

                  {m.data && m.data.length > 0 && (
                    <div className="mt-5 overflow-hidden rounded-xl border border-border/60 bg-card/30">
                      <div className="flex items-center justify-between border-b border-border/40 px-3 py-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Data Table
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Top {m.data.length}
                        </div>
                      </div>

                      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <span>SKU</span>
                        <span>Net Revenue</span>
                      </div>

                      <div className="divide-y divide-border/30">
                        {(() => {
                          const rows = m.data.map((d) => {
                            const numeric = toNumericValue(String(d.value));
                          return {
                              label: d.label,
                              numeric,
                              fullFormatted:
                                numeric !== null
                                  ? `₦${formatDataValue(String(numeric))}`
                                  : String(d.value ?? ""),
                              compactFormatted:
                                numeric !== null
                                  ? formatCompactNaira(numeric)
                                  : String(d.value ?? ""),
                            };
                          });
                          const maxNumeric = rows.reduce(
                            (acc, r) =>
                              r.numeric !== null && r.numeric > acc
                                ? r.numeric
                                : acc,
                            0,
                          );

                          return rows.map((row, idx) => {
                            const barWidth =
                              row.numeric !== null && maxNumeric > 0
                                ? Math.max((row.numeric / maxNumeric) * 100, 3)
                                : 0;

                            return (
                              <div
                                key={`${row.label}-${idx}`}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 text-sm odd:bg-card/20 hover:bg-muted/20"
                              >
                                <div className="min-w-0">
                                  <div
                                    className="truncate text-foreground/90"
                                    title={row.label}
                                  >
                                    {row.label}
                                  </div>
                                  {barWidth > 0 && (
                                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#489237]/20">
                                      <div
                                        className="h-full rounded-full bg-[#489237]/70"
                                        style={{ width: `${barWidth}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                                <span
                                  className="font-semibold tabular-nums"
                                  title={row.fullFormatted}
                                >
                                  {row.compactFormatted}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-3 text-muted-foreground">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="hover:text-foreground"
                          onClick={() => navigator.clipboard.writeText(m.content)}
                          aria-label="Copy"
                        >
                          <Copy size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        Copy
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="hover:text-foreground"
                          onClick={onRegenerate}
                          aria-label="Regenerate"
                        >
                          <RefreshCcw size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        Regenerate
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="hover:text-foreground"
                          aria-label="Helpful"
                        >
                          <ThumbsUp size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        Helpful
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="hover:text-foreground"
                          aria-label="Not helpful"
                        >
                          <ThumbsDown size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        Not helpful
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </>
              ) : editingIndex === i ? (
                <div className="space-y-2">
                  <textarea
                    value={editingValue}
                    autoFocus
                    onChange={(e) => onEditingValueChange(e.target.value)}
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
                    className="min-h-20 min-w-0 w-full resize-y rounded-lg border border-border/60 bg-background/60 p-2 outline-none focus:ring-1 focus:ring-primary/60 sm:min-w-md"
                  />
                  <div className="flex justify-end gap-2 text-muted-foreground">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="rounded-md p-1 transition hover:bg-muted/40 hover:text-foreground"
                          onClick={onCancelEdit}
                          aria-label="Cancel edit"
                        >
                          <X size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        Cancel edit
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="rounded-md p-1 transition hover:bg-muted/40 hover:text-foreground"
                          onClick={onSaveEdit}
                          aria-label="Save and regenerate"
                        >
                          <Check size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        Save and regenerate
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0 whitespace-pre-wrap">{m.content}</div>
                  <div className="visible flex gap-2 opacity-100 transition-opacity sm:invisible sm:opacity-0 sm:group-hover:visible sm:group-hover:opacity-100 sm:group-focus-within:visible sm:group-focus-within:opacity-100">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="rounded-md p-1 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground focus-visible:opacity-100"
                          onClick={() => navigator.clipboard.writeText(m.content)}
                          aria-label="Copy"
                        >
                          <Copy size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        Copy
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="rounded-md p-1 text-muted-foreground transition hover:bg-muted/40 hover:text-foreground focus-visible:opacity-100"
                          onClick={() => onStartEdit(i, m.content)}
                          aria-label="Edit message"
                        >
                          <Edit size={14} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        Edit message
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
