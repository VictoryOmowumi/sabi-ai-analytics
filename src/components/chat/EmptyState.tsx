
import SuggestedTopics from "../topics/SuggestedTopics";

export default function EmptyState() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Ask SABI AI Analytics
      </h1>

      <p className="mt-3 text-zinc-400">
        Get insights from operational data, performance metrics, and reports.
      </p>

      <div className="mt-10 w-full">
        <SuggestedTopics onPick={(text: string) => {
          console.log("Picked topic:", text);
        }} />
      </div>
    </div>
  );
}
