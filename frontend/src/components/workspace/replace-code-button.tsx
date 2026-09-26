"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { replaceCodeCopy } from "@/content/upload";
import { UploadDropzone } from "./upload-dropzone";

interface ReplaceCodeButtonProps {
  projectId: string;
  fileCount: number;
}

// Upload a newer version of the code. The backend swaps all files in one transaction.
export function ReplaceCodeButton({
  projectId,
  fileCount,
}: ReplaceCodeButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 text-silver-400 underline decoration-line-strong underline-offset-2 transition-colors hover:text-paper"
      >
        {replaceCodeCopy.button}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={replaceCodeCopy.title}
        description={replaceCodeCopy.description(fileCount)}
      >
        <UploadDropzone
          projectId={projectId}
          onUploaded={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
