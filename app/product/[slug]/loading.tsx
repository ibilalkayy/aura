export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="aspect-square w-full animate-pulse rounded-2xl bg-line" />
        <div className="space-y-3">
          <div className="h-4 w-24 animate-pulse rounded bg-line" />
          <div className="h-7 w-3/4 animate-pulse rounded bg-line" />
          <div className="h-4 w-32 animate-pulse rounded bg-line" />
          <div className="h-9 w-40 animate-pulse rounded bg-line" />
          <div className="h-24 w-full animate-pulse rounded bg-line" />
        </div>
      </div>
    </div>
  );
}
