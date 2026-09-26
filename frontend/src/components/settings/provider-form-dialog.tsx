"use client";

import { useActionState, useId, useState, useTransition } from "react";
import { Check, CircleAlert, Pencil, Plus } from "lucide-react";
import {
  saveProviderAction,
  testConnectionAction,
  type ProviderFormState,
} from "@/app/(app)/settings/providers/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { PROVIDER_PRESETS } from "@/lib/providers";
import type { AiProvider } from "@/lib/types";

interface ProviderFormDialogProps {
  /** Given = edit this provider; missing = add a new one. */
  provider?: AiProvider;
}

interface TestResult {
  ok: boolean;
  message: string;
  models: string[];
}

export function ProviderFormDialog({ provider }: ProviderFormDialogProps) {
  const editing = Boolean(provider);
  // Many of these dialogs live on one page (add + one per provider): ids must be unique.
  const uid = useId();
  const ids = {
    name: `${uid}-name`,
    url: `${uid}-url`,
    key: `${uid}-key`,
    model: `${uid}-model`,
    models: `${uid}-models`,
  };
  const [open, setOpen] = useState(false);
  const initialValues = {
    name: provider?.name ?? "",
    baseUrl: provider?.baseUrl ?? "",
    model: provider?.model ?? "",
    apiKey: "",
  };
  const [values, setValues] = useState(initialValues);
  const [test, setTest] = useState<TestResult | null>(null);
  const [testing, startTest] = useTransition();
  const [state, formAction, pending] = useActionState(
    async (previous: ProviderFormState, formData: FormData) => {
      const result = await saveProviderAction(
        provider?.id ?? null,
        previous,
        formData,
      );
      if (result.ok) {
        setOpen(false);
        // A new "Add provider" dialog should start empty; an edit keeps the saved values.
        if (!editing) setValues(initialValues);
        setTest(null);
      }
      return result;
    },
    { ok: true },
  );

  const set =
    (key: keyof typeof values) => (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [key]: event.target.value }));

  function runTest() {
    const formData = new FormData();
    formData.set("baseUrl", values.baseUrl);
    formData.set("apiKey", values.apiKey);
    startTest(async () => setTest(await testConnectionAction(formData)));
  }

  return (
    <>
      {editing ? (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <Pencil aria-hidden className="size-4" strokeWidth={1.5} />
          Edit
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus aria-hidden className="size-4" strokeWidth={1.5} />
          Add provider
        </Button>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit ${provider?.name}` : "Add a provider"}
        description="Any OpenAI-compatible API works. Nothing is hardcoded."
      >
        <form action={formAction} className="space-y-5">
          <FormError message={state.error} />
          {!editing && (
            <div>
              <p className="mb-2 font-mono text-[11px] tracking-label text-silver-500 uppercase">
                Start from
              </p>
              <div className="flex flex-wrap gap-2">
                {PROVIDER_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    aria-pressed={values.baseUrl === preset.baseUrl}
                    onClick={() => {
                      setValues((current) => ({
                        ...current,
                        ...preset,
                        apiKey: current.apiKey,
                      }));
                      setTest(null);
                    }}
                    className={cn(
                      "rounded-sm border px-2.5 py-1.5 text-xs transition-colors",
                      values.baseUrl === preset.baseUrl
                        ? "border-silver-300 bg-ink-850 text-paper"
                        : "border-line text-silver-300 hover:border-line-strong hover:text-paper",
                    )}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <Field id={ids.name} label="Name">
            <Input
              id={ids.name}
              name="name"
              required
              maxLength={60}
              value={values.name}
              onChange={set("name")}
            />
          </Field>
          <Field
            id={ids.url}
            label="Base URL"
            hint="For example http://localhost:1234/v1"
          >
            <Input
              id={ids.url}
              name="baseUrl"
              type="url"
              required
              pattern="https?://.+"
              title="Starts with http:// or https://"
              value={values.baseUrl}
              onChange={set("baseUrl")}
              aria-describedby={`${ids.url}-hint`}
              className="font-mono"
            />
          </Field>
          <Field
            id={ids.key}
            label="API key"
            hint={
              editing && provider?.hasApiKey
                ? "A key is stored (encrypted). Leave empty to keep it."
                : "Stored encrypted. Leave empty for local servers like LM Studio or Ollama."
            }
          >
            <Input
              id={ids.key}
              name="apiKey"
              type="password"
              autoComplete="off"
              maxLength={500}
              value={values.apiKey}
              onChange={set("apiKey")}
              aria-describedby={`${ids.key}-hint`}
              className="font-mono"
            />
          </Field>
          <Field id={ids.model} label="Model">
            <Input
              id={ids.model}
              name="model"
              required
              maxLength={100}
              list={ids.models}
              value={values.model}
              onChange={set("model")}
              className="font-mono"
            />
            {/* Native autocomplete from the models the test connection found. */}
            <datalist id={ids.models}>
              {test?.models.map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
          </Field>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={runTest}
              disabled={testing}
            >
              {testing ? "Testing…" : "Test connection"}
            </Button>
            {test && (
              <p
                role="status"
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  test.ok ? "text-silver-300" : "text-red",
                )}
              >
                {test.ok ? (
                  <Check aria-hidden className="size-3.5" strokeWidth={1.5} />
                ) : (
                  <CircleAlert
                    aria-hidden
                    className="size-3.5"
                    strokeWidth={1.5}
                  />
                )}
                {test.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-5">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save provider"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
