"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { runReviewAction } from "@/app/(app)/projects/[id]/actions";
import { Button } from "@/components/ui/button";
import { DemoLimitPanel } from "@/components/app/demo-limit-panel";
import { FormError } from "@/components/ui/form-error";
import { inputClass } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { MODE_LABEL } from "@/lib/labels";
import type { ReviewMode, ReviewPlan } from "@/lib/types";
import { useElapsed, withElapsed } from "@/lib/use-elapsed";

export const REVIEW_FORM_ID = "review-form";

const lensHints: Record<ReviewMode, string> = {
  SECURITY: "Secrets, auth, validation, injection",
  PERFORMANCE: "Slow paths, re-renders, extra queries",
  QUALITY: "Naming, structure, readability",
};

interface ReviewFormProps {
  projectId: string;
  currentFile?: string;
  /** Readable files, for the two pickers of a diff review. */
  paths: string[];
  /** How many files a whole-project review sends (null while not loaded). */
  plan: ReviewPlan | null;
}

function planText(plan: ReviewPlan): string {
  const hidden = plan.hidden ? ` · ${plan.hidden} hidden for privacy` : "";
  return plan.fits >= plan.total
    ? `All ${plan.total} files fit in one review${hidden}`
    : `${plan.fits} of ${plan.total} files fit in one review, source code first${hidden}`;
}

const radioCard =
  "flex cursor-pointer items-start gap-3 rounded-sm border border-line px-3 py-2.5 transition-colors hover:border-line-strong has-checked:border-silver-300 has-checked:bg-ink-850";

export function ReviewForm({
  projectId,
  currentFile,
  paths,
  plan,
}: ReviewFormProps) {
  const [state, formAction, pending] = useActionState(
    runReviewAction.bind(null, projectId),
    {},
  );
  const seconds = useElapsed(pending);
  const [ticked, setTicked] = useState(0);

  // The tree's checkboxes join this form with the `form` attribute but live outside it
  // in the DOM, so their change events are heard on the document. Ticking a file picks
  // "Selected files": otherwise the review would silently run on the open file only.
  useEffect(() => {
    function onChange(event: Event) {
      const box = event.target;
      if (
        !(box instanceof HTMLInputElement) ||
        box.name !== "files" ||
        box.form?.id !== REVIEW_FORM_ID
      )
        return;
      const scope = box.form.elements.namedItem("scope") as RadioNodeList;
      if (box.checked) scope.value = "FILES";
      setTicked(
        document.querySelectorAll(
          `input[name="files"][form="${REVIEW_FORM_ID}"]:checked`,
        ).length,
      );
    }
    document.addEventListener("change", onChange);
    return () => document.removeEventListener("change", onChange);
  }, []);

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

      <fieldset className="group space-y-2">
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
              {ticked > 0
                ? `${ticked} ${ticked === 1 ? "file" : "files"} ticked`
                : "Tick files in the tree"}
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
              {plan ? planText(plan) : "Every stored file"}
            </span>
          </span>
        </label>
        <label className={radioCard}>
          <input
            id="scope-diff"
            type="radio"
            name="scope"
            value="DIFF"
            className="mt-1 accent-silver-200"
          />
          <span>
            <span className="block text-sm text-paper">Compare two files</span>
            <span className="block text-xs text-silver-500">
              Review only what changed between them
            </span>
          </span>
        </label>
        {/* Shown only while "Compare two files" is picked (CSS, no state). */}
        <div className="hidden space-y-2 pl-7 group-has-[#scope-diff:checked]:block">
          {(["before", "after"] as const).map((side) => (
            <label key={side} className="block space-y-1">
              <span className="block font-mono text-[11px] text-silver-500 capitalize">
                {side}
              </span>
              {/* Type a name ("auth.ts") or pick from the list; the backend resolves it. */}
              <input
                name={side}
                list="diff-file-options"
                defaultValue={side === "after" ? (currentFile ?? "") : ""}
                placeholder="Type or pick a file"
                autoComplete="off"
                spellCheck={false}
                className={cn(inputClass, "h-9 font-mono text-xs")}
              />
            </label>
          ))}
          <datalist id="diff-file-options">
            {paths.map((path) => (
              <option key={path} value={path} />
            ))}
          </datalist>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? withElapsed("Reviewing…", seconds) : "Run review"}
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
