"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { generateInsightAction } from "@/app/(app)/projects/[id]/actions";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";

interface InsightFormProps {
  projectId: string;
  label: string;
  /** Extra fields, e.g. a hidden kind or a select. */
  children: ReactNode;
}

export function InsightForm({ projectId, label, children }: InsightFormProps) {
  const [state, formAction, pending] = useActionState(
    generateInsightAction.bind(null, projectId),
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <FormError message={state.error} />
      <div className="flex gap-2">
        {children}
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={pending}
          className="shrink-0"
        >
          {pending ? "Generating…" : label}
        </Button>
      </div>
    </form>
  );
}
