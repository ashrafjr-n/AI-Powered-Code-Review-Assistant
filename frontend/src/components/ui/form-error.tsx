import { CircleAlert } from "lucide-react";

// Red budget: errors. role="alert" makes screen readers announce it.
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-sm border border-red/40 px-3 py-2 text-sm text-red"
    >
      <CircleAlert
        aria-hidden
        className="mt-0.5 size-4 shrink-0"
        strokeWidth={1.5}
      />
      {message}
    </p>
  );
}
