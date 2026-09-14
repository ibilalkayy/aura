export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 h-6 w-40 animate-pulse rounded bg-line" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-white p-4">
            <div className="aspect-square w-full animate-pulse rounded-xl bg-line" />
            <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-line" />
            <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
