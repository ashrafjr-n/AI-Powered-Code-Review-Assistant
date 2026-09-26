import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FolderTree } from "lucide-react";
import { ChatPanel } from "@/components/workspace/chat-panel";
import { CodeViewer } from "@/components/workspace/code-viewer";
import { FileTree } from "@/components/workspace/file-tree";
import { HiddenFileNotice } from "@/components/workspace/hidden-file-notice";
import { InsightsPanel } from "@/components/workspace/insights-panel";
import { PanelTabs } from "@/components/workspace/panel-tabs";
import { REVIEW_FORM_ID } from "@/components/workspace/review-form";
import { ReviewPanel } from "@/components/workspace/review-panel";
import { UploadDropzone } from "@/components/workspace/upload-dropzone";
import { UploadSummary } from "@/components/workspace/upload-summary";
import { buildFileTree } from "@/lib/file-tree";
import { firstParam, parseTab } from "@/lib/workspace-url";
import { listChatSessions } from "@/lib/api/chat";
import { getFile, listFiles } from "@/lib/api/files";
import { listInsights } from "@/lib/api/insights";
import { getProject } from "@/lib/api/projects";
import { getReviewPlan, listReviews } from "@/lib/api/reviews";

export async function generateMetadata({
  params,
}: PageProps<"/projects/[id]">): Promise<Metadata> {
  const project = await getProject((await params).id);
  return { title: project?.name ?? "Project not found" };
}

export default async function WorkspacePage({
  params,
  searchParams,
}: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const project = await getProject(id);
  if (!project) notFound();

  const files = await listFiles(id);
  if (files.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <UploadDropzone projectId={id} />
      </div>
    );
  }

  const tab = parseTab(query.tab);
  const requested = firstParam(query.file);
  // A hidden (sensitive) file only opens when asked for; the default is README or the first readable file.
  const selected =
    files.find((candidate) => candidate.path === requested) ??
    files.find((candidate) => candidate.path.toLowerCase() === "readme.md") ??
    files.find((candidate) => !candidate.sensitive) ??
    files[0];
  const line = Number(firstParam(query.line)) || undefined;

  const [file, reviews, sessions, insights, plan] = await Promise.all([
    // Sensitive files have no content to load (the backend refuses anyway).
    selected.sensitive ? null : getFile(id, selected.path),
    listReviews({ projectId: id }),
    listChatSessions(id),
    listInsights(id),
    tab === "review" ? getReviewPlan(id) : null,
  ]);
  // Only possible if the files were replaced between the two requests.
  if (!file && !selected.sensitive) notFound();
  const chatParam = firstParam(query.chat);
  const activeChat =
    chatParam === "new"
      ? null
      : (sessions.find((s) => s.id === chatParam) ?? sessions[0] ?? null);

  const tree = (
    <FileTree
      projectId={id}
      nodes={buildFileTree(files)}
      selectedPath={selected.path}
      tab={tab}
      selectForm={tab === "review" ? REVIEW_FORM_ID : undefined}
    />
  );

  return (
    <div>
      <div className="grid gap-4 lg:h-[calc(100dvh-7.5rem)] lg:min-h-[560px] lg:grid-cols-[240px_minmax(0,1fr)_360px]">
        {/* One file tree: collapsible on small screens, a plain sidebar on desktop. */}
        <div className="min-h-0 rounded-md border border-line bg-ink-900 lg:overflow-auto">
          <details open className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-mono text-xs text-silver-400 lg:hidden [&::-webkit-details-marker]:hidden">
              <FolderTree aria-hidden className="size-4" strokeWidth={1.5} />
              Files ({project.fileCount})
            </summary>
            <div className="max-h-72 overflow-auto border-t border-line p-2 lg:max-h-none lg:overflow-visible lg:border-t-0">
              <p className="mb-2 border-b border-line px-2 pb-2 font-mono text-[11px] text-silver-500">
                <UploadSummary
                  fileCount={project.fileCount}
                  stats={project.uploadStats}
                />
              </p>
              {tree}
            </div>
          </details>
        </div>

        <div className="flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-md border border-line bg-ink-900 lg:min-h-0">
          {file ? (
            <CodeViewer
              file={file}
              highlightLine={file.path === requested ? line : undefined}
            />
          ) : (
            <HiddenFileNotice path={selected.path} />
          )}
        </div>

        <aside
          aria-label="Review, chat and insights"
          className="flex min-h-[480px] min-w-0 flex-col overflow-hidden rounded-md border border-line bg-ink-900 lg:min-h-0"
        >
          <PanelTabs projectId={id} active={tab} file={selected.path} />
          <div className="min-h-0 flex-1 overflow-auto">
            {tab === "review" && (
              <ReviewPanel
                projectId={id}
                currentFile={file?.path}
                reviews={reviews}
                plan={plan}
              />
            )}
            {tab === "chat" && (
              <ChatPanel
                projectId={id}
                sessions={sessions}
                active={activeChat}
              />
            )}
            {tab === "insights" && (
              <InsightsPanel projectId={id} insights={insights} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
