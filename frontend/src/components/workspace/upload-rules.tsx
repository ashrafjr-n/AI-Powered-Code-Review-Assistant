import { uploadRules } from "@/content/upload";

// What happens to a ZIP (kept, skipped, hidden, redacted), so uploads are predictable.
export function UploadRules() {
  return (
    <dl className="grid gap-x-8 gap-y-4 rounded-md border border-line p-5 text-sm sm:grid-cols-2">
      {uploadRules.map((rule) => (
        <div key={rule.title}>
          <dt className="font-mono text-[11px] tracking-label text-silver-500 uppercase">
            {rule.title}
          </dt>
          <dd className="mt-1 leading-relaxed text-silver-400">{rule.body}</dd>
        </div>
      ))}
    </dl>
  );
}
