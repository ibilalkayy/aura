"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Side = "right" | "bottom";

export default function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: Side;
  children: ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const panelPosition =
    side === "right"
      ? "right-0 top-0 h-full w-full max-w-md border-l"
      : "bottom-0 left-0 w-full max-h-[85vh] rounded-t-2xl border-t";

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "absolute flex flex-col border-line bg-surface shadow-xl",
          "transition-transform duration-200 ease-out",
          panelPosition,
          className
        )}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 className="font-display text-lg text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="text-ink-muted hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
