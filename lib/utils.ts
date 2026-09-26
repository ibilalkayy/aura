import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merges Tailwind class lists, letting later classes win over conflicting
// earlier ones (e.g. cn("px-4", condition && "px-6") -> "px-6" wins).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
