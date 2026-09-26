"use client";

import { startTransition, useActionState } from "react";
import type { FormEvent } from "react";
import { runReviewAction } from "@/app/(app)/projects/[id]/actions";
import { Button } from "@/components/ui/button";
import { DemoLimitPanel } from "@/components/app/demo-limit-panel";
import { FormError } from "@/components/ui/form-error";
import { MODE_LABEL } from "@/lib/labels";
import type { ReviewMode } from "@/lib/types";

export const REVIEW_FORM_ID = "review-form";

const lensHints: Record<ReviewMode, string> = {
  SECURITY: "Secrets, auth, validation, injection",
  PERFORMANCE: "Slow paths, re-renders, extra queries",
  QUALITY: "Naming, structure, readability",
};

interface ReviewFormProps {
  projectId: string;
  currentFile?: string;
}

const radioCard =
  "flex cursor-pointer items-start gap-3 rounded-sm border border-line px-3 py-2.5 transition-colors hover:border-line-strong has-checked:border-silver-300 has-checked:bg-ink-850";

export function ReviewForm({ projectId, currentFile }: ReviewFormProps) {
  const [state, formAction, pending] = useActionState(
    runReviewAction.bind(null, projectId),
    {},
  );

  // Submitted by hand (not the form's action prop), because React resets a form after an
  // action. After an error the user would lose their lens, scope and ticked files.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form id={REVIEW_FORM_ID} onSubmit={onSubmit} className="space-y-6">
      {state.demo && <DemoLimitPanel notice={state.demo} />}
      <FormError message={state.error} />
      <fieldset className="space-y-2">
        <legend className="mb-3 font-mono text-[11px] tracking-label text-silver-500 uppercase">
          Lens
        </legend>
        {(Object.keys(MODE_LABEL) as ReviewMode[]).map((mode, index) => (
          <label key={mode} className={radioCard}>
            <input
              type="radio"
              name="mode"
              value={mode}
              defaultChecked={index === 0}
              className="mt-1 accent-silver-200"
            />
            <span>
              <span className="block text-sm text-paper">
                {MODE_LABEL[mode]}
              </span>
              <span className="block text-xs text-silver-500">
                {lensHints[mode]}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-3 font-mono text-[11px] tracking-label text-silver-500 uppercase">
          Scope
        </legend>
        <input type="hidden" name="currentFile" value={currentFile ?? ""} />
        <label className={radioCard}>
          <input
            type="radio"
            name="scope"
            value="FILE"
            defaultChecked
            className="mt-1 accent-silver-200"
          />
          <span className="min-w-0">
            <span className="block text-sm text-paper">This file</span>
            <span className="block truncate font-mono text-xs text-silver-500">
              {currentFile ?? "No file open"}
            </span>
          </span>
        </label>
        <label className={radioCard}>
          <input
            type="radio"
            name="scope"
            value="FILES"
            className="mt-1 accent-silver-200"
          />
          <span>
            <span className="block text-sm text-paper">Selected files</span>
            <span className="block text-xs text-silver-500">
              Tick files in the tree
            </span>
          </span>
        </label>
        <label className={radioCard}>
          <input
            type="radio"
            name="scope"
            value="PROJECT"
            className="mt-1 accent-silver-200"
          />
          <span>
            <span className="block text-sm text-paper">Whole project</span>
            <span className="block text-xs text-silver-500">
              Every stored file
            </span>
          </span>
        </label>
      </fieldset>

      <div className="space-y-2">
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Reviewing…" : "Run review"}
        </Button>
        <p aria-live="polite" className="text-center text-xs text-silver-500">
          {pending
            ? "Local models can take a minute. You can keep reading code."
            : ""}
        </p>
      </div>
    </form>
  );
}
