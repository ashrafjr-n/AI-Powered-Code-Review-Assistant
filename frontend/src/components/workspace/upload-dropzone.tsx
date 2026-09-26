"use client";

import { useState, useTransition } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { FileArchive, FolderUp, UploadCloud } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { errorMessage } from "@/lib/api/error-message";
import { cn } from "@/lib/cn";
import { droppedEntries, readEntries } from "@/lib/dropped-files";
import { formatBytes } from "@/lib/format";
import {
  MAX_PICKED_ZIP_BYTES,
  slimFiles,
  slimZip,
  zipProblem,
  type SlimResult,
} from "@/lib/upload";

// The folder picker attribute works in all modern browsers but isn't in React's types,
// so it's passed through a spread.
const folderPicker = { webkitdirectory: "" };

interface UploadDropzoneProps {
  projectId: string;
  /** Called after a successful upload (the "Replace code" dialog closes itself). */
  onUploaded?: () => void;
}

function isZip(file: File): boolean {
  return file.name.toLowerCase().endsWith(".zip");
}

export function UploadDropzone({ projectId, onUploaded }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // 1. Slim the code here (drop node_modules, build output, binaries; empty secret files).
  // 2. Send one small ZIP straight to the backend (next.config rewrites /api), not through
  //    a Server Action: those accept 1 MB bodies. The backend checks everything again.
  function send(prepare: () => Promise<SlimResult>) {
    setError(undefined);
    startTransition(async () => {
      const slim = await prepare();
      if (!slim.ok) {
        setError(slim.error);
        return;
      }
      const body = new FormData();
      body.set(
        "file",
        new Blob([slim.zip], { type: "application/zip" }),
        "code.zip",
      );
      // What the browser already left out, for the "N skipped" note in the workspace.
      body.set("skipped", JSON.stringify(slim.skipped));
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
        onUploaded?.();
      }
    });
  }

  function sendZip(file: File) {
    const problem = zipProblem(file.name, file.size);
    if (problem) return setError(problem);
    send(async () => slimZip(new Uint8Array(await file.arrayBuffer())));
  }

  /** Loose files; a folder's files carry their path in webkitRelativePath. */
  function sendFiles(files: File[]) {
    if (files.length === 1 && isZip(files[0])) return sendZip(files[0]);
    send(() =>
      slimFiles(
        files.map((file) => ({
          path: file.webkitRelativePath || file.name,
          file,
        })),
      ),
    );
  }

  /** From a file picker: one ZIP, several files, or a whole folder. */
  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length > 0) sendFiles(files);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const files = [...event.dataTransfer.files];
    // Read now: the browser clears dataTransfer after this handler.
    const entries = droppedEntries(event.dataTransfer);
    // No folders among the dropped items (or no folder support): plain files.
    if (!entries.some((entry) => entry.isDirectory)) {
      if (files.length > 0) sendFiles(files);
      return;
    }
    send(async () => {
      const { files: picked, skippedFolders } = await readEntries(entries);
      return slimFiles(picked, skippedFolders);
    });
  }

  return (
    <div className="space-y-4">
      <FormError message={error} />
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        aria-busy={pending}
        className={cn(
          "flex flex-col items-center rounded-md border border-dashed px-6 pt-16 pb-10 text-center transition-colors focus-within:border-silver-300",
          dragging
            ? "border-silver-200 bg-ink-850"
            : "border-line-strong hover:border-silver-500 hover:bg-ink-900",
          pending && "pointer-events-none",
        )}
      >
        <label className="flex cursor-pointer flex-col items-center">
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
            {pending
              ? "Reading your code…"
              : "Drop a project folder, files or a .zip"}
          </span>
          <span className="mt-2 max-w-sm text-sm leading-relaxed text-silver-400">
            or click to choose files or a ZIP (up to{" "}
            {formatBytes(MAX_PICKED_ZIP_BYTES)}).
          </span>
          <input
            type="file"
            multiple
            className="sr-only"
            disabled={pending}
            onChange={onPick}
          />
        </label>
        <label
          className={cn(buttonClass("secondary", "sm"), "mt-6 cursor-pointer")}
        >
          <FolderUp aria-hidden className="size-4" strokeWidth={1.5} />
          Choose a folder
          <input
            type="file"
            {...folderPicker}
            className="sr-only"
            disabled={pending}
            onChange={onPick}
          />
        </label>
      </div>
    </div>
  );
}
