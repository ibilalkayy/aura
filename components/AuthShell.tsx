import { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-5xl overflow-hidden rounded-2xl border border-line bg-surface sm:my-10 lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink p-10 text-paper lg:flex">
        <span className="font-display text-2xl">Aura</span>
        <div>
          <p className="font-display text-3xl leading-tight">
            Shop without the noise.
          </p>
          <p className="mt-3 max-w-sm text-sm text-paper/70">
            No sponsored listings, no ads bolted onto checkout — just the
            product you came for.
          </p>
        </div>
        <p className="text-xs text-paper/50">
          &copy; {new Date().getFullYear()} Aura
        </p>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <h1 className="font-display text-2xl text-ink mb-1">{title}</h1>
        <p className="mb-6 text-sm text-ink-muted">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
