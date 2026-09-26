import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col px-4 py-6 sm:px-8">
      <Link href="/" aria-label="Redline home" className="self-start">
        <Logo className="h-6 w-auto" />
      </Link>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {/* Red budget: errors. */}
        <p className="font-mono text-sm tracking-label text-red">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-display text-paper">
          This page doesn&apos;t exist.
        </h1>
        <p className="mt-3 max-w-md text-silver-400">
          The link may be old, or the page was moved or deleted.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/projects" className={buttonClass("primary")}>
            Go to projects
          </Link>
          <Link href="/" className={buttonClass("secondary")}>
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
