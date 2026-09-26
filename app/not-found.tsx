import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="font-display text-6xl text-line">404</p>
      <h1 className="font-display mt-3 text-2xl text-ink">Page not found</h1>
      <p className="mt-2 text-ink-muted">
        That page doesn&apos;t exist, or the link&apos;s out of date.
      </p>
      <Link href="/" className="mt-6 inline-block">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
