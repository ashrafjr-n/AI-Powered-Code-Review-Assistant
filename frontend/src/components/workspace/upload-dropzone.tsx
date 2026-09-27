"use client";

import { useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { FileArchive, FolderUp, UploadCloud } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { uploadProgress } from "@/content/upload";
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
import { useElapsed } from "@/lib/use-elapsed";

// The folder picker attribute works in all modern browsers but isn't in React's types,
// so it's passed through a spread.
const folderPicker = { webkitdirectory: "" };

interface UploadDropzoneProps {
  projectId: string;
  /** Called after a successful upload (the "Replace code" dialog closes itself). */
  onUploaded?: () => void;
}

/** Where a running upload is, so the drop zone can say it (a long wait never looks frozen). */
type UploadStep =
  | { kind: "preparing" }
  | { kind: "uploading"; files: number; bytes: number }
  | { kind: "opening" };

// Preparing takes about a second, so a longer wait while uploading means the server is
// slow to answer, usually because the free host is waking up.
const SLOW_UPLOAD_SECONDS = 10;

function stepLabel(step: UploadStep): string {
  if (step.kind === "uploading")
    return uploadProgress.uploading(step.files, formatBytes(step.bytes));
  return uploadProgress[step.kind];
}

function isZip(file: File): boolean {
  return file.name.toLowerCase().endsWith(".zip");
}

export function UploadDropzone({ projectId, onUploaded }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string>();
  // null = idle. Not a transition: `router.refresh()` isn't tracked by one, so the drop
  // zone would look idle for a moment before the workspace appears.
  const [step, setStep] = useState<UploadStep | null>(null);
  const busy = step !== null;
  const seconds = useElapsed(busy);
  const slowUpload =
    step?.kind === "uploading" && seconds >= SLOW_UPLOAD_SECONDS;
  const router = useRouter();

  // 1. Slim the code here (drop node_modules, build output, binaries; empty secret files).
  // 2. Send one small ZIP straight to the backend (next.config rewrites /api), not through
  //    a Server Action: those accept 1 MB bodies. The backend checks everything again.
  async function send(prepare: () => Promise<SlimResult>) {
    function fail(message: string) {
      setError(message);
      setStep(null);
    }
    setError(undefined);
    setStep({ kind: "preparing" });
    const slim = await prepare().catch(() => null);
    if (!slim) return fail("Your files could not be read. Try again.");
    if (!slim.ok) return fail(slim.error);
    const body = new FormData();
    body.set(
      "file",
      new Blob([slim.zip], { type: "application/zip" }),
      "code.zip",
    );
    // What the browser already left out, for the "N skipped" note in the workspace.
    body.set("skipped", JSON.stringify(slim.skipped));
    setStep({
      kind: "uploading",
      files: slim.fileCount,
      bytes: slim.zip.length,
    });
    const response = await fetch(
      `/api/projects/${encodeURIComponent(projectId)}/files`,
      { method: "POST", body },
    ).catch(() => null);
    // Stays busy while the browser goes to the login page.
    if (response?.status === 401) return router.push("/login?expired=1");
    if (!response?.ok)
      return fail(
        response
          ? await errorMessage(response)
          : "Upload failed. Check your connection and try again.",
      );
    // Re-render the Server Component page, which now finds the files. The first-upload
    // drop zone stays busy until the workspace replaces it; the Replace dialog closes.
    setStep({ kind: "opening" });
    router.refresh();
    if (onUploaded) {
      onUploaded();
      setStep(null);
    }
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
        aria-busy={busy}
        className={cn(
          "flex flex-col items-center rounded-md border border-dashed px-6 pt-16 pb-10 text-center transition-colors focus-within:border-silver-300",
          dragging
            ? "border-silver-200 bg-ink-850"
            : "border-line-strong hover:border-silver-500 hover:bg-ink-900",
          busy && "pointer-events-none",
        )}
      >
        <label className="flex cursor-pointer flex-col items-center">
          {busy ? (
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
          {/* Screen readers hear each step and the slow-server note, not the ticking timer. */}
          <span
            aria-live="polite"
            className="mt-5 flex max-w-sm flex-col items-center"
          >
            <span className="font-medium text-paper">
              {step
                ? stepLabel(step)
                : "Drop a project folder, files or a .zip"}
            </span>
            {busy ? (
              <>
                {seconds > 0 && (
                  <span
                    aria-hidden
                    className="mt-2 font-mono text-xs text-silver-500 tabular-nums"
                  >
                    {seconds}s
                  </span>
                )}
                {slowUpload && (
                  <span className="mt-2 text-sm leading-relaxed text-silver-400">
                    {uploadProgress.slowServer}
                  </span>
                )}
              </>
            ) : (
              <span className="mt-2 text-sm leading-relaxed text-silver-400">
                or click to choose files or a ZIP (up to{" "}
                {formatBytes(MAX_PICKED_ZIP_BYTES)}).
              </span>
            )}
          </span>
          <input
            type="file"
            multiple
            className="sr-only"
            disabled={busy}
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
            disabled={busy}
            onChange={onPick}
          />
        </label>
      </div>
    </div>
  );
}
