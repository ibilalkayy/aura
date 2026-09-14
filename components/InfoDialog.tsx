"use client";

export default function InfoDialog({
  open,
  title,
  message,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="font-display text-lg text-ink">{title}</h2>
        <p className="mt-2 text-sm text-ink/60">{message}</p>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
