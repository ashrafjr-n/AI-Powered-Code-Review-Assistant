"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "./button";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button variant="ghost" size="sm" onClick={copy} aria-live="polite">
      {copied ? (
        <Check aria-hidden className="size-4" strokeWidth={1.5} />
      ) : (
        <Copy aria-hidden className="size-4" strokeWidth={1.5} />
      )}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}
