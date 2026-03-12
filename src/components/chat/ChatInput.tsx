
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Square } from "lucide-react";
export default function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  loading,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: (v: string) => void;
  onStop?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="shrink-0 border-t border-border/60 bg-background/95 p-4 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-lg border border-border/60 bg-card/40 p-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask anything about your data..."
          className="border-0 bg-transparent! focus-visible:ring-0"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) onSend(value);
          }}
        />

        {loading ? (
          <Button type="button" variant="outline" onClick={onStop}>
            <Square className=" h-4 w-4" />
          </Button>
        ) : (
          <Button  onClick={() => onSend(value)} disabled={!value.trim() || disabled}>
            <Send className=" mt-1 h-4 w-4" stroke-width={1} />
          </Button>
        )}
      </div>
    </div>
  );
}
