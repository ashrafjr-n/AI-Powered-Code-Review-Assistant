import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, FolderTree } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ChatPanel } from "@/components/workspace/chat-panel";
import { CodeViewer } from "@/components/workspace/code-viewer";
import { FileTree } from "@/components/workspace/file-tree";
import { InsightsPanel } from "@/components/workspace/insights-panel";
import { PanelTabs } from "@/components/workspace/panel-tabs";
import { REVIEW_FORM_ID } from "@/components/workspace/review-form";
import { ReviewPanel } from "@/components/workspace/review-panel";
import { UploadDropzone } from "@/components/workspace/upload-dropzone";
import { buildFileTree } from "@/lib/file-tree";
import { firstParam, parseTab } from "@/lib/workspace-url";
import { listInsights } from "@/mocks/insights";
import { listChatSessions } from "@/lib/api/chat";
import { getFile, listFiles } from "@/lib/api/files";
import { getProject } from "@/lib/api/projects";
import { listReviews } from "@/lib/api/reviews";

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
  const back = (
    <Link
      href="/projects"
      className="mb-4 inline-flex items-center gap-1 font-mono text-xs text-silver-500 hover:text-paper"
    >
      <ChevronLeft aria-hidden className="size-3.5" strokeWidth={1.5} />
      Projects
    </Link>
  );

  if (files.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          {back}
          <PageHeader
            title={project.name}
            description={project.description || undefined}
          />
        </div>
        <UploadDropzone projectId={id} />
      </div>
    );
  }

  const tab = parseTab(query.tab);
  const requested = firstParam(query.file);
  const selected =
    files.find((candidate) => candidate.path === requested) ??
    files.find((candidate) => candidate.path.toLowerCase() === "readme.md") ??
    files[0];
  const line = Number(firstParam(query.line)) || undefined;

  const [file, reviews, sessions, insights] = await Promise.all([
    getFile(id, selected.path),
    listReviews({ projectId: id }),
    listChatSessions(id),
    listInsights(id),
  ]);
  // Only possible if the files were replaced between the two requests.
  if (!file) notFound();
  const chatParam = firstParam(query.chat);
  const activeChat =
    chatParam === "new"
      ? null
      : (sessions.find((s) => s.id === chatParam) ?? sessions[0] ?? null);

  const tree = (
    <FileTree
      projectId={id}
      nodes={buildFileTree(files)}
      selectedPath={file.path}
      tab={tab}
      selectForm={tab === "review" ? REVIEW_FORM_ID : undefined}
    />
  );

  return (
    <div className="space-y-6">
      <div>
        {back}
        <PageHeader
          title={project.name}
          description={`${files.length} files${project.description ? ` · ${project.description}` : ""}`}
        />
      </div>

      <div className="grid gap-4 lg:h-[calc(100dvh-13rem)] lg:min-h-[560px] lg:grid-cols-[240px_minmax(0,1fr)_360px]">
        {/* One file tree: collapsible on small screens, a plain sidebar on desktop. */}
        <div className="min-h-0 rounded-md border border-line bg-ink-900 lg:overflow-auto">
          <details open className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-mono text-xs text-silver-400 lg:hidden [&::-webkit-details-marker]:hidden">
              <FolderTree aria-hidden className="size-4" strokeWidth={1.5} />
              Files ({files.length})
            </summary>
            <div className="max-h-72 overflow-auto border-t border-line p-2 lg:max-h-none lg:overflow-visible lg:border-t-0">
              {tree}
            </div>
          </details>
        </div>

        <div className="flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-md border border-line bg-ink-900 lg:min-h-0">
          <CodeViewer
            file={file}
            highlightLine={file.path === requested ? line : undefined}
          />
        </div>

        <aside
          aria-label="Review, chat and insights"
          className="flex min-h-[480px] min-w-0 flex-col overflow-hidden rounded-md border border-line bg-ink-900 lg:min-h-0"
        >
          <PanelTabs projectId={id} active={tab} file={file.path} />
          <div className="min-h-0 flex-1 overflow-auto">
            {tab === "review" && (
              <ReviewPanel
                projectId={id}
                currentFile={file.path}
                reviews={reviews}
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
