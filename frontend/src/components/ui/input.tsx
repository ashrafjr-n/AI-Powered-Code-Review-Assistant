import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// :user-invalid only turns red after the user has interacted (not on first load).
export const inputClass =
  "h-10 w-full rounded-sm border border-line-strong bg-ink-800 px-3 text-sm text-paper placeholder:text-silver-500 transition-colors hover:border-silver-500 focus-visible:border-silver-300 focus-visible:outline-none user-invalid:border-red";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}
