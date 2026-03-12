
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="text-sm text-muted-foreground">Something went wrong.</div>
        <div className="mt-2 text-xs text-muted-foreground">{error.message}</div>
        <button onClick={reset} className="mt-3 rounded-lg border border-border px-3 py-2 text-sm">
          Try again
        </button>
      </div>
    </div>
  );
}
