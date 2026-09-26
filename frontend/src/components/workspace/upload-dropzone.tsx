"use client";

import { useState, useTransition } from "react";
import type { DragEvent } from "react";
import { useRouter } from "next/navigation";
import { FileArchive, UploadCloud } from "lucide-react";
import { FormError } from "@/components/ui/form-error";
import { errorMessage } from "@/lib/api/error-message";
import { cn } from "@/lib/cn";
import { formatBytes } from "@/lib/format";
import { MAX_ZIP_BYTES, zipProblem } from "@/lib/upload";

interface UploadDropzoneProps {
  projectId: string;
}

export function UploadDropzone({ projectId }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // The ZIP goes straight to the backend (next.config rewrites /api), not through a
  // Server Action: those accept 1 MB bodies. The backend checks ownership and limits again.
  function send(file: File) {
    const problem = zipProblem(file.name, file.size);
    setError(problem ?? undefined);
    if (problem) return;
    const body = new FormData();
    body.set("file", file);
    startTransition(async () => {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/files`,
        { method: "POST", body },
      ).catch(() => null);
      if (response?.status === 401) {
        router.push("/login?expired=1");
      } else if (!response?.ok) {
        setError(
          response
            ? await errorMessage(response)
            : "Upload failed. Check your connection and try again.",
        );
      } else {
        // Re-render the Server Component page, which now finds the files.
        router.refresh();
      }
    });
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) send(file);
  }

  return (
    <div className="space-y-4">
      <FormError message={error} />
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
          or click to choose a file. Max {formatBytes(MAX_ZIP_BYTES)}.
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
