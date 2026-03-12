import SuggestedTopics from "@/components/topics/SuggestedTopics";

type ChatEmptyStateProps = {
  onPickTopic: (topic: string) => void;
};

export default function ChatEmptyState({ onPickTopic }: ChatEmptyStateProps) {
  return (
    <div className="pt-10">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground/90">
          SABI AI Analytics
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ask anything about your data.
        </p>
      </div>
      <div className="mx-auto mt-6 max-w-3xl">
        <SuggestedTopics onPick={onPickTopic} />
      </div>
    </div>
  );
}
