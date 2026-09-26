"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderFormDialog } from "./provider-form-dialog";

export function AddProviderButton({ localModels }: { localModels: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden className="size-4" strokeWidth={1.5} />
        Add provider
      </Button>
      <ProviderFormDialog
        localModels={localModels}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
