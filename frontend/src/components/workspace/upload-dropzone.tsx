"use client";

import { startTransition, useActionState, useState } from "react";
import type { DragEvent } from "react";
import { FileArchive, UploadCloud } from "lucide-react";
import { uploadZipAction } from "@/app/(app)/projects/[id]/actions";
import { FormError } from "@/components/ui/form-error";
import { cn } from "@/lib/cn";
import { formatBytes } from "@/lib/format";
import { zipProblem } from "@/lib/upload";

interface UploadDropzoneProps {
  projectId: string;
}

export function UploadDropzone({ projectId }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [clientError, setClientError] = useState<string>();
  const [state, formAction, pending] = useActionState(
    uploadZipAction.bind(null, projectId),
    {},
  );

  function send(file: File) {
    const problem = zipProblem(file.name, file.size);
    setClientError(problem ?? undefined);
    if (problem) return;
    const formData = new FormData();
    formData.set("fileName", file.name);
    formData.set("fileSize", String(file.size));
    // Called outside a <form> submit, so it must run inside a transition.
    startTransition(() => formAction(formData));
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) send(file);
  }

  return (
    <div className="space-y-4">
      <FormError message={clientError ?? state.error} />
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-busy={pending}
        className={cn(
          "flex cursor-pointer flex-col items-center rounded-md border border-dashed px-6 py-20 text-center transition-colors",
          dragging
            ? "border-silver-200 bg-ink-850"
            : "border-line-strong hover:border-silver-500 hover:bg-ink-900",
          pending && "pointer-events-none",
        )}
      >
        {pending ? (
          <FileArchive
            aria-hidden
            className="size-7 animate-pulse text-silver-300"
            strokeWidth={1.5}
          />
        ) : (
          <UploadCloud
            aria-hidden
            className="size-7 text-silver-400"
            strokeWidth={1.5}
          />
        )}
        <span className="mt-5 font-medium text-paper">
          {pending ? "Unpacking your code…" : "Drop a .zip of your project"}
        </span>
        <span className="mt-2 max-w-sm text-sm leading-relaxed text-silver-400">
          or click to choose a file. Max {formatBytes(10 * 1024 * 1024)}.
          node_modules, build output, .git and binary files are skipped.
        </span>
        <input
          type="file"
          accept=".zip,application/zip"
          className="sr-only"
          disabled={pending}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) send(file);
            event.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
