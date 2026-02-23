export default function StreamingIndicator() {
  return (
    <div className="flex items-center gap-1 text-zinc-400">
      <span className="animate-pulse">●</span>
      <span className="animate-pulse delay-150">●</span>
      <span className="animate-pulse delay-300">●</span>
    </div>
  );
}
