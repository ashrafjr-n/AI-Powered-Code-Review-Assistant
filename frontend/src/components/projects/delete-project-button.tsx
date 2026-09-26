"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProjectAction } from "@/app/(app)/projects/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { projectsCopy } from "@/content/projects";

const copy = projectsCopy.deleteDialog;

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
  fileCount: number;
}

export function DeleteProjectButton({
  projectId,
  projectName,
  fileCount,
}: DeleteProjectButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      await deleteProjectAction(projectId);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Delete ${projectName}`}
        className="relative z-10 flex size-8 items-center justify-center rounded-sm text-silver-500 transition-colors hover:bg-ink-850 hover:text-paper"
      >
        <Trash2 aria-hidden className="size-4" strokeWidth={1.5} />
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Delete “${projectName}”?`}
      >
        <p className="text-sm leading-relaxed text-silver-400">
          This deletes the project, its {fileCount} files, and every review and
          chat in it. <span className="text-paper">This can’t be undone.</span>
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            disabled={pending}
          >
            {pending ? copy.pending : copy.submit}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
