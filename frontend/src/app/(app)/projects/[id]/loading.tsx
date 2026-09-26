import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
  return (
    <div aria-busy="true" aria-label="Loading project">
      <div className="grid gap-4 lg:h-[calc(100dvh-7.5rem)] lg:grid-cols-[240px_minmax(0,1fr)_360px]">
        <Skeleton className="h-40 rounded-md lg:h-full" />
        <Skeleton className="h-96 rounded-md lg:h-full" />
        <Skeleton className="h-96 rounded-md lg:h-full" />
      </div>
    </div>
  );
}
