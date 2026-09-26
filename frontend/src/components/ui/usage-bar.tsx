import { cn } from "@/lib/cn";

interface UsageBarProps {
  used: number;
  limit: number;
  /** Read by screen readers, e.g. "Demo requests used today". */
  label: string;
  className?: string;
}

// A thin bar that fills up as the allowance is used. Silver only (red is for errors).
export function UsageBar({ used, limit, label, className }: UsageBarProps) {
  const percent = limit > 0 ? Math.min(100, (used / limit) * 100) : 100;
  return (
    <span
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={used}
      aria-valuetext={`${used} of ${limit}`}
      className={cn(
        "block h-1.5 overflow-hidden rounded-full bg-line",
        className,
      )}
    >
      <span
        className="block h-full rounded-full bg-silver-200 transition-[width] duration-200"
        style={{ width: `${percent}%` }}
      />
    </span>
  );
}
