"use client";

import { useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-ink"
      >
        {title}
        <ChevronDown
          size={16}
          className={cn("shrink-0 text-ink-muted transition-transform", open && "rotate-180")}
        />
      </button>
      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden pb-4 text-sm text-ink-muted">{children}</div>
      </div>
    </div>
  );
}

export default function Accordion({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-line border-t border-line">{children}</div>;
}
