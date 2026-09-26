"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createProjectAction } from "@/app/(app)/projects/actions";
import type { ProjectFormState } from "@/app/(app)/projects/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { projectsCopy } from "@/content/projects";

const copy = projectsCopy.createDialog;

interface NewProjectDialogProps {
  label: string;
}

export function NewProjectDialog({ label }: NewProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (_previous: ProjectFormState, formData: FormData) => {
      const result = await createProjectAction(formData);
      if (result.ok) setOpen(false);
      return result;
    },
    { ok: true },
  );

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden className="size-4" strokeWidth={1.5} />
        {label}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={copy.title}
        description={copy.description}
      >
        <form action={formAction} className="space-y-5">
          <FormError message={state.error} />
          <Field id="project-name" label="Name">
            <Input
              id="project-name"
              name="name"
              required
              maxLength={100}
              placeholder={copy.namePlaceholder}
              autoComplete="off"
            />
          </Field>
          <Field id="project-description" label="Description">
            <Textarea
              id="project-description"
              name="description"
              maxLength={500}
              placeholder={copy.descriptionPlaceholder}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? copy.pending : copy.submit}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
