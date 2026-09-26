import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-y rounded-sm border border-line-strong bg-ink-800 px-3 py-2 text-sm text-paper placeholder:text-silver-500 transition-colors hover:border-silver-500 focus-visible:border-silver-300 focus-visible:outline-none user-invalid:border-red",
        className,
      )}
      {...props}
    />
  );
}
