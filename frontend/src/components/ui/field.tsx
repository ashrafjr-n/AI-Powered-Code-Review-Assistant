import type { ReactNode } from "react";

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}

// Label + control + optional hint. The control must use the same id (and aria-describedby={`${id}-hint`} if hint).
export function Field({ id, label, hint, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-silver-200">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-silver-500">
          {hint}
        </p>
      )}
    </div>
  );
}
