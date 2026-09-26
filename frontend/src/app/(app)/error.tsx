"use client"; // Error boundaries must be Client Components.

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonClass } from "@/components/ui/button";

interface AppErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

// Catches errors in any signed-in page. The shell (sidebar, top bar) stays usable.
export default function AppError({ error, retry }: AppErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
      <p className="font-mono text-sm tracking-label text-red">Error</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-display text-paper">
        Something went wrong on this page.
      </h1>
      <p className="mt-3 text-silver-400">
        Try again. If it keeps happening, the server may be down.
      </p>
      {error.digest && (
        <p className="mt-4 font-mono text-xs text-silver-500">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-8 flex gap-3">
        <Button onClick={retry}>Try again</Button>
        <Link href="/projects" className={buttonClass("secondary")}>
          Go to projects
        </Link>
      </div>
    </div>
  );
}
