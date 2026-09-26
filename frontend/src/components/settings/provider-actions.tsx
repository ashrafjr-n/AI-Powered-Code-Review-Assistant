"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import {
  deleteProviderAction,
  setDefaultProviderAction,
} from "@/app/(app)/settings/providers/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface ProviderActionsProps {
  id: string;
  name: string;
  isDefault: boolean;
}

export function ProviderActions({ id, name, isDefault }: ProviderActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      {!isDefault && (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => setDefaultProviderAction(id))}
        >
          Use for reviews
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        aria-label={`Delete ${name}`}
      >
        <Trash2 aria-hidden className="size-4" strokeWidth={1.5} />
      </Button>
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Delete “${name}”?`}
      >
        <p className="text-sm leading-relaxed text-silver-400">
          Its stored API key is deleted too. Past reviews keep the model name
          they used.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteProviderAction(id);
                setConfirming(false);
              })
            }
          >
            {pending ? "Deleting…" : "Delete provider"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
