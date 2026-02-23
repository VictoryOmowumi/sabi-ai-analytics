
import { Copy, RefreshCw, ThumbsUp, ThumbsDown } from "lucide-react";
import clsx from "clsx";
export default function ChatMessage({
  role,
  content,
  onRegenerate,
}: {
  role: "user" | "assistant";
  content: string;
  onRegenerate?: () => void;
}) {
  const isUser = role === "user";

  const copy = () => navigator.clipboard.writeText(content);

  return (
    <div className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={clsx("max-w-xl  px-4 py-3 text-sm ", isUser ? "bg-primary text-primary-foreground rounded-t-lg" : "bg-secondary text-secondary-foreground")}>
        {content}

        {!isUser && (
          <div className="mt-2.5 flex gap-3 text-zinc-400">
            <button onClick={copy}><Copy size={14} /></button>
            <button onClick={onRegenerate}><RefreshCw size={14} /></button>
            <button><ThumbsUp size={14} /></button>
            <button><ThumbsDown size={14} /></button>
          </div>
        )}
        
      </div>
    </div>
  );
}
