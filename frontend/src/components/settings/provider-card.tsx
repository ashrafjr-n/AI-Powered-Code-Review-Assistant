"use client";

import { useRef, useState, useTransition } from "react";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import {
  deleteProviderAction,
  setDefaultProviderAction,
} from "@/app/(app)/settings/providers/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { providerLocation } from "@/lib/providers";
import type { AiProvider } from "@/lib/types";
import { ProviderFormDialog } from "./provider-form-dialog";

interface ProviderCardProps {
  provider: AiProvider;
  localModels: boolean;
}

const MENU_ITEM =
  "flex h-9 w-full items-center gap-3 rounded-sm px-3 text-silver-300 transition-colors hover:bg-ink-850 hover:text-paper";

// One saved model. The main card is plain; a saved card is one big button: a click makes it main.
// Edit and Delete sit in a small native popover menu, outside that button (no nested buttons).
export function ProviderCard({ provider, localModels }: ProviderCardProps) {
  const { id, name, isDefault } = provider;
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const [pending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = `provider-menu-${id}`;
  // A unique anchor per card, so each menu opens under its own button.
  const anchor = `--provider-menu-${id}`;

  function openDialog(which: "edit" | "delete") {
    menuRef.current?.hidePopover();
    setDialog(which);
  }

  const details = (
    <>
      <span className="flex items-center gap-2 font-mono text-[11px] tracking-label uppercase">
        <span
          aria-hidden
          className={cn(
            "size-2 rounded-full",
            isDefault ? "bg-paper" : "border border-silver-500",
          )}
        />
        <span className={isDefault ? "text-paper" : "text-silver-500"}>
          {isDefault ? "Main" : "Saved"}
        </span>
        {isDefault && (
          <span className="tracking-normal text-silver-500 normal-case">
            · runs reviews, chat and insights
          </span>
        )}
      </span>
      <span className="mt-3 flex flex-wrap items-center gap-2 pr-10">
        <span className="font-medium text-paper">{name}</span>
        <span className="rounded-sm border border-line px-1.5 py-0.5 font-mono text-[11px] tracking-label text-silver-500 uppercase">
          {providerLocation(provider.baseUrl)}
        </span>
      </span>
      <span className="mt-1 block truncate font-mono text-xs text-silver-400">
        {provider.baseUrl} · {provider.model}
      </span>
      <span className="mt-1 flex justify-between gap-3 font-mono text-xs text-silver-500">
        <span>
          {provider.hasApiKey ? "API key stored, encrypted" : "No API key"}
        </span>
        {!isDefault && (
          <span className="text-silver-400 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {pending ? "Switching…" : "Make main →"}
          </span>
        )}
      </span>
    </>
  );

  return (
    <li
      className={cn(
        "relative rounded-md border transition-colors",
        isDefault
          ? "border-silver-300 bg-ink-850 sm:col-span-2"
          : "border-line bg-ink-900 hover:border-line-strong",
      )}
    >
      {isDefault ? (
        <div className="p-5">{details}</div>
      ) : (
        <button
          type="button"
          disabled={pending}
          aria-label={`Make ${name} the main model`}
          onClick={() => startTransition(() => setDefaultProviderAction(id))}
          className="group block w-full rounded-md p-5 text-left disabled:opacity-60"
        >
          {details}
        </button>
      )}

      <button
        type="button"
        popoverTarget={menuId}
        aria-label={`More actions for ${name}`}
        style={{ anchorName: anchor }}
        className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-sm text-silver-400 transition-colors hover:bg-ink-800 hover:text-paper"
      >
        <Ellipsis aria-hidden className="size-4" strokeWidth={1.5} />
      </button>
      {/* Without anchor positioning the browser centers the popover (UA default): still usable. */}
      <div
        ref={menuRef}
        id={menuId}
        popover="auto"
        style={{ positionAnchor: anchor }}
        className="m-0 w-40 rounded-md border border-line bg-ink-900 p-1 text-sm shadow-[0_16px_48px_-12px_rgb(0_0_0/0.8)] supports-[position-area:bottom]:inset-auto supports-[position-area:bottom]:mt-1 supports-[position-area:bottom]:[position-area:bottom_span-left]"
      >
        <button
          type="button"
          onClick={() => openDialog("edit")}
          className={MENU_ITEM}
        >
          <Pencil aria-hidden className="size-4" strokeWidth={1.5} />
          Edit
        </button>
        <button
          type="button"
          onClick={() => openDialog("delete")}
          className={MENU_ITEM}
        >
          <Trash2 aria-hidden className="size-4" strokeWidth={1.5} />
          Delete
        </button>
      </div>

      <ProviderFormDialog
        provider={provider}
        localModels={localModels}
        open={dialog === "edit"}
        onClose={() => setDialog(null)}
      />
      <Dialog
        open={dialog === "delete"}
        onClose={() => setDialog(null)}
        title={`Delete “${name}”?`}
      >
        <p className="text-sm leading-relaxed text-silver-400">
          Its stored API key is deleted too. Past reviews keep the model name
          they used.
          {isDefault && " Another saved model becomes main."}
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDialog(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteProviderAction(id);
                setDialog(null);
              })
            }
          >
            {pending ? "Deleting…" : "Delete provider"}
          </Button>
        </div>
      </Dialog>
    </li>
  );
}
