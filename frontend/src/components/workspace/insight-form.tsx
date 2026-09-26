"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { generateInsightAction } from "@/app/(app)/projects/[id]/actions";
import { DemoLimitPanel } from "@/components/app/demo-limit-panel";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { useElapsed, withElapsed } from "@/lib/use-elapsed";

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
  const seconds = useElapsed(pending);

  return (
    <form action={formAction} className="space-y-3">
      {state.demo && <DemoLimitPanel notice={state.demo} />}
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
          {pending ? withElapsed("Generating…", seconds) : label}
        </Button>
      </div>
    </form>
  );
}
