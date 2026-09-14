import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="font-display text-6xl text-ink/20">404</p>
      <h1 className="font-display mt-3 text-2xl text-ink">Page not found</h1>
      <p className="mt-2 text-ink/60">
        That page doesn&apos;t exist, or the link's out of date.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-medium text-white hover:bg-brand-dark"
      >
        Back to home
      </Link>
    </div>
  );
}
