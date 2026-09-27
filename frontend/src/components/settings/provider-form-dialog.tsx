"use client";

import { useActionState, useId, useState, useTransition } from "react";
import { Check, CircleAlert } from "lucide-react";
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
import { tunnelHint } from "@/content/providers";
import { PROVIDER_PRESETS } from "@/lib/providers";
import type { AiProvider, ConnectionResult } from "@/lib/types";

interface ProviderFormDialogProps {
  /** Given = edit this provider; missing = add a new one. */
  provider?: AiProvider;
  /** false on a public server: localhost presets need a tunnel address instead. */
  localModels: boolean;
  open: boolean;
  onClose: () => void;
}

export function ProviderFormDialog({
  provider,
  localModels,
  open,
  onClose,
}: ProviderFormDialogProps) {
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
  const initialValues = {
    name: provider?.name ?? "",
    baseUrl: provider?.baseUrl ?? "",
    model: provider?.model ?? "",
    apiKey: "",
  };
  const [values, setValues] = useState(initialValues);
  const [test, setTest] = useState<ConnectionResult | null>(null);
  // Edit only: forget the stored key (e.g. the provider moved to a local server).
  const [removeKey, setRemoveKey] = useState(false);
  // A local preset picked on a public server: ask for the tunnel's https address.
  const [needsTunnel, setNeedsTunnel] = useState(false);
  const [testing, startTest] = useTransition();
  const [state, formAction, pending] = useActionState(
    async (previous: ProviderFormState, formData: FormData) => {
      const result = await saveProviderAction(
        provider?.id ?? null,
        previous,
        formData,
      );
      if (result.ok) {
        onClose();
        // A new "Add provider" dialog should start empty; an edit keeps the saved values.
        if (!editing) setValues(initialValues);
        setTest(null);
        setRemoveKey(false);
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
    // The stored key is only used while it is kept.
    if (provider && !removeKey) formData.set("providerId", provider.id);
    startTest(async () => setTest(await testConnectionAction(formData)));
  }

  // The trigger lives with the caller (the add button, or a card's menu).
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
                  aria-pressed={values.name === preset.name}
                  onClick={() => {
                    const tunnel = preset.local && !localModels;
                    setValues((current) => ({
                      ...current,
                      name: preset.name,
                      baseUrl: tunnel ? "" : preset.baseUrl,
                      model: preset.model,
                    }));
                    setNeedsTunnel(tunnel);
                    setTest(null);
                  }}
                  className={cn(
                    "rounded-sm border px-2.5 py-1.5 text-xs transition-colors",
                    values.name === preset.name
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
          hint={
            needsTunnel ? tunnelHint : "For example https://api.openai.com/v1"
          }
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
              ? "A key is stored (encrypted). Leave empty to keep it. Enter it again if you change the base URL, or remove it."
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
            disabled={removeKey}
            aria-describedby={`${ids.key}-hint`}
            className="font-mono disabled:cursor-not-allowed disabled:opacity-50"
          />
          {editing && provider?.hasApiKey && (
            <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-silver-300">
              <input
                type="checkbox"
                name="removeApiKey"
                checked={removeKey}
                onChange={(event) => {
                  setRemoveKey(event.target.checked);
                  setValues((current) => ({ ...current, apiKey: "" }));
                  setTest(null);
                }}
                className="size-3.5 accent-silver-200"
              />
              Remove the stored key (for local servers without a key)
            </label>
          )}
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
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save provider"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
