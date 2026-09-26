import { LockKeyhole } from "lucide-react";
import { privacyText } from "@/content/privacy";

// Shown in the code viewer instead of a sensitive file's content (there is none to show).
export function HiddenFileNotice({ path }: { path: string }) {
  return (
    <section
      aria-label={`Code: ${path}`}
      className="flex min-h-0 flex-1 flex-col"
    >
      <header className="border-b border-line px-4 py-2.5 font-mono text-xs text-silver-500 italic">
        {path}
      </header>
      <div className="m-auto max-w-md space-y-3 p-8 text-center">
        <LockKeyhole
          aria-hidden
          className="mx-auto size-6 text-silver-400"
          strokeWidth={1.5}
        />
        <h2 className="font-medium text-paper">
          {privacyText.hiddenFileTitle}
        </h2>
        <p className="text-sm leading-relaxed text-silver-400">
          {privacyText.hiddenFileBody}
        </p>
      </div>
    </section>
  );
}
