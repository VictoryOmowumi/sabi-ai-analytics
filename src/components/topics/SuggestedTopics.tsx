
import { Button } from "@/components/ui/button";

const topics = [
  "Show me customer performance trends over the last year",
  "Top performing sales regions this quarter",
  "Top distributors by sales volume",
  "Compare Production Line A and B performance",
];

export default function SuggestedTopics({
  onPick,
}: {
  onPick: (text: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {topics.map((t) => (
        <Button
          key={t}
          variant="outline"
          className=" rounded-full border-border/60 bg-card/30 text-xs text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          onClick={() => onPick(t)}
        >
          {t}
        </Button>
      ))}
    </div>
  );
}
