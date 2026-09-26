import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading project">
      <div className="space-y-2 border-b border-line pb-6">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-56" />
      </div>
      <div className="grid gap-4 lg:h-[calc(100dvh-13rem)] lg:grid-cols-[240px_minmax(0,1fr)_360px]">
        <Skeleton className="h-40 rounded-md lg:h-full" />
        <Skeleton className="h-96 rounded-md lg:h-full" />
        <Skeleton className="h-96 rounded-md lg:h-full" />
      </div>
    </div>
  );
}
