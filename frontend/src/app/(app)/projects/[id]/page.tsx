import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { FolderTree } from "lucide-react";
import { ChatPanel } from "@/components/workspace/chat-panel";
import { CodeViewer } from "@/components/workspace/code-viewer";
import { FileTree } from "@/components/workspace/file-tree";
import { HiddenFileNotice } from "@/components/workspace/hidden-file-notice";
import { InsightDocument } from "@/components/workspace/insight-document";
import { InsightsPanel } from "@/components/workspace/insights-panel";
import { PanelTabs } from "@/components/workspace/panel-tabs";
import { ResizablePanes } from "@/components/workspace/resizable-panes";
import { REVIEW_FORM_ID } from "@/components/workspace/review-form";
import { ReviewPanel } from "@/components/workspace/review-panel";
import { ReplaceCodeButton } from "@/components/workspace/replace-code-button";
import { UploadDropzone } from "@/components/workspace/upload-dropzone";
import { UploadRules } from "@/components/workspace/upload-rules";
import { UploadSummary } from "@/components/workspace/upload-summary";
import { buildFileTree } from "@/lib/file-tree";
import { issueMarkers } from "@/lib/issue-markers";
import { PANE_COOKIE, parsePaneCookie } from "@/lib/pane-layout";
import {
  firstParam,
  parseDoc,
  parseTab,
  workspaceHref,
} from "@/lib/workspace-url";
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
      <div className="mx-auto max-w-3xl space-y-4">
        <UploadDropzone projectId={id} />
        <UploadRules />
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
  // A generated document takes the wide middle pane while the Insights tab is open.
  const openDoc =
    tab === "insights"
      ? insights.find((insight) => insight.kind === parseDoc(query.doc))
      : undefined;
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
    <ResizablePanes
      initial={parsePaneCookie((await cookies()).get(PANE_COOKIE)?.value)}
      tree={
        // One file tree: collapsible on small screens, a plain sidebar on desktop.
        <div className="min-h-0 rounded-md border border-line bg-ink-900 lg:overflow-auto">
          <details open className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-mono text-xs text-silver-400 lg:hidden [&::-webkit-details-marker]:hidden">
              <FolderTree aria-hidden className="size-4" strokeWidth={1.5} />
              Files ({project.fileCount})
            </summary>
            <div className="max-h-72 overflow-auto border-t border-line p-2 lg:max-h-none lg:overflow-visible lg:border-t-0">
              <div className="mb-2 flex items-start justify-between gap-2 border-b border-line px-2 pb-2 font-mono text-[11px] text-silver-500">
                <UploadSummary
                  fileCount={project.fileCount}
                  stats={project.uploadStats}
                />
                <ReplaceCodeButton
                  projectId={id}
                  fileCount={project.fileCount}
                />
              </div>
              {tree}
            </div>
          </details>
        </div>
      }
      code={
        <div className="flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-md border border-line bg-ink-900 lg:min-h-0">
          {openDoc ? (
            <InsightDocument
              insight={openDoc}
              totalFiles={project.fileCount}
              closeHref={workspaceHref(id, {
                tab: "insights",
                file: selected.path,
              })}
            />
          ) : file ? (
            <CodeViewer
              file={file}
              highlightLine={file.path === requested ? line : undefined}
              markers={issueMarkers(reviews, file.path, project.codeVersion)}
            />
          ) : (
            <HiddenFileNotice path={selected.path} />
          )}
        </div>
      }
      panel={
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
                paths={files
                  .filter((entry) => !entry.sensitive)
                  .map((entry) => entry.path)}
                reviews={reviews}
                plan={plan}
              />
            )}
            {tab === "chat" && (
              <ChatPanel
                projectId={id}
                sessions={sessions}
                currentFile={file?.path}
                active={activeChat}
              />
            )}
            {tab === "insights" && (
              <InsightsPanel
                projectId={id}
                insights={insights}
                openDoc={openDoc?.kind}
                file={selected.path}
              />
            )}
          </div>
        </aside>
      }
    />
  );
}
