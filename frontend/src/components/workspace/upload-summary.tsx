import { HoverNote } from "@/components/ui/cursor-tip";
import { privacyText } from "@/content/privacy";
import type { UploadStats } from "@/lib/types";

interface UploadSummaryProps {
  fileCount: number;
  stats: UploadStats | null;
}

const number = new Intl.NumberFormat("en-US");

// "580 files · 3 hidden · 1,240 skipped": what the last upload kept and left out.
export function UploadSummary({ fileCount, stats }: UploadSummaryProps) {
  if (!stats) return <span>{number.format(fileCount)} files</span>;
  const { ignored, binary, tooLarge } = stats.skipped;
  const skipped = ignored + binary + tooLarge;
  const reasons = [
    ignored && `${number.format(ignored)} dependencies, build output or caches`,
    binary && `${number.format(binary)} binary`,
    tooLarge && `${number.format(tooLarge)} larger than 512 KB`,
  ].filter(Boolean);

  return (
    <span className="flex flex-wrap items-center gap-x-1.5">
      <span>{number.format(stats.kept)} files</span>
      {stats.sensitive > 0 && (
        <HoverNote note={privacyText.hiddenFileNote}>
          · {stats.sensitive} hidden
        </HoverNote>
      )}
      {skipped > 0 && (
        <HoverNote note={`Skipped: ${reasons.join(", ")}.`}>
          · {number.format(skipped)} skipped
        </HoverNote>
      )}
      {stats.redacted > 0 && (
        <HoverNote note={privacyText.redactedNote}>
          · {stats.redacted} {stats.redacted === 1 ? "secret" : "secrets"}{" "}
          redacted
        </HoverNote>
      )}
    </span>
  );
}
