"use client";

import { useActionState, useOptimistic } from "react";
import type { KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";
import {
  sendChatAction,
  type ChatActionState,
} from "@/app/(app)/projects/[id]/actions";
import { DemoLimitPanel } from "@/components/app/demo-limit-panel";
import { FormError } from "@/components/ui/form-error";

interface ChatComposerProps {
  projectId: string;
  sessionId: string | null;
  suggestions: string[];
}

export function ChatComposer({
  projectId,
  sessionId,
  suggestions,
}: ChatComposerProps) {
  // Shows the question right away while the server works (replaced by the real list after).
  const [pendingQuestion, setPendingQuestion] = useOptimistic<string | null>(
    null,
  );
  const [state, formAction, pending] = useActionState(
    async (previous: ChatActionState, formData: FormData) => {
      setPendingQuestion(String(formData.get("question") ?? ""));
      return sendChatAction(projectId, sessionId, previous, formData);
    },
    {},
  );

  // Enter sends, Shift+Enter makes a new line.
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="space-y-3 border-t border-line p-4">
      {pending && pendingQuestion && (
        <div aria-live="polite" className="space-y-2">
          <p className="ml-8 rounded-md bg-ink-800 px-3 py-2 text-sm text-paper">
            {pendingQuestion}
          </p>
          <p className="font-mono text-xs text-silver-500">Reading the code…</p>
        </div>
      )}
      {state.demo && <DemoLimitPanel notice={state.demo} />}
      <FormError message={state.error} />
      <form action={formAction} className="space-y-3">
        {suggestions.length > 0 && !pending && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="submit"
                name="question"
                value={suggestion}
                formNoValidate
                className="rounded-sm border border-line px-2.5 py-1.5 text-left text-xs text-silver-300 transition-colors hover:border-line-strong hover:text-paper"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <label htmlFor="chat-question" className="sr-only">
            Ask about this code
          </label>
          {/* Remounts with the failed question, so an error never loses the user's text. */}
          <textarea
            key={state.question ?? ""}
            defaultValue={state.question}
            id="chat-question"
            name="question"
            rows={3}
            required
            maxLength={2000}
            disabled={pending}
            onKeyDown={onKeyDown}
            placeholder="Ask about this code…"
            className="w-full resize-none rounded-sm border border-line-strong bg-ink-800 py-2 pr-12 pl-3 text-sm text-paper placeholder:text-silver-500 focus-visible:border-silver-300 focus-visible:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            aria-label="Send question"
            className="absolute right-2 bottom-3 flex size-8 items-center justify-center rounded-sm bg-paper text-ink-950 transition-colors hover:bg-silver-200 disabled:opacity-50"
          >
            <ArrowUp aria-hidden className="size-4" strokeWidth={1.5} />
          </button>
        </div>
      </form>
    </div>
  );
}
