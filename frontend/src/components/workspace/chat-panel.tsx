import Link from "next/link";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileCode2, Plus } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { ChatSession } from "@/lib/types";
import { workspaceHref } from "@/lib/workspace-url";
import { ChatComposer } from "./chat-composer";

const SUGGESTIONS = [
  "Explain how authentication works.",
  "Which file handles database connections?",
  "Where are errors handled?",
];

interface ChatPanelProps {
  projectId: string;
  sessions: ChatSession[];
  /** The file open in the code viewer; always sent as context. */
  currentFile?: string;
  /** null = a new, empty conversation. */
  active: ChatSession | null;
}

export function ChatPanel({
  projectId,
  sessions,
  currentFile,
  active,
}: ChatPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-line p-3">
        <details className="relative min-w-0 flex-1">
          <summary className="flex h-8 cursor-pointer list-none items-center truncate rounded-sm border border-line px-3 text-sm text-silver-300 hover:border-line-strong [&::-webkit-details-marker]:hidden">
            {active?.title ?? "New conversation"}
          </summary>
          <ul className="absolute top-9 right-0 left-0 z-20 max-h-64 overflow-auto rounded-md border border-line bg-ink-900 p-1 shadow-[0_16px_48px_-12px_rgb(0_0_0/0.8)]">
            {sessions.length === 0 && (
              <li className="px-3 py-2 text-sm text-silver-500">
                No conversations yet.
              </li>
            )}
            {sessions.map((session) => (
              <li key={session.id}>
                <Link
                  href={workspaceHref(projectId, {
                    tab: "chat",
                    chat: session.id,
                  })}
                  aria-current={session.id === active?.id ? "page" : undefined}
                  className={cn(
                    "block truncate rounded-sm px-3 py-2 text-sm hover:bg-ink-850 hover:text-paper",
                    session.id === active?.id
                      ? "text-paper"
                      : "text-silver-400",
                  )}
                >
                  {session.title}
                </Link>
              </li>
            ))}
          </ul>
        </details>
        <Link
          href={workspaceHref(projectId, { tab: "chat", chat: "new" })}
          className={buttonClass("secondary", "sm")}
          aria-label="New conversation"
        >
          <Plus aria-hidden className="size-4" strokeWidth={1.5} />
        </Link>
      </div>

      <ol
        className="min-h-0 flex-1 space-y-5 overflow-auto p-4"
        aria-label="Messages"
      >
        {!active || active.messages.length === 0 ? (
          <li className="text-sm leading-relaxed text-silver-500">
            Ask anything about this project. Answers use your uploaded files as
            context and list the files they read.
          </li>
        ) : (
          active.messages.map((message) =>
            message.role === "USER" ? (
              <li
                key={message.id}
                className="ml-8 rounded-md bg-ink-800 px-3 py-2 text-sm text-paper"
              >
                {message.content}
              </li>
            ) : (
              <li key={message.id} className="space-y-2">
                {/* Model output is untrusted: react-markdown builds React elements,
                    no raw HTML runs (same as generated docs). */}
                <div className="doc-view doc-compact">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </Markdown>
                </div>
                {message.sources && message.sources.length > 0 && (
                  <p className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-xs text-silver-500">
                    Sources:
                    {message.sources.map((source) => (
                      <Link
                        key={source}
                        href={workspaceHref(projectId, {
                          tab: "chat",
                          chat: active.id,
                          file: source,
                        })}
                        className="text-silver-300 underline decoration-line-strong underline-offset-2 hover:text-paper"
                      >
                        {source}
                      </Link>
                    ))}
                  </p>
                )}
              </li>
            ),
          )
        )}
      </ol>

      {currentFile && (
        <p className="flex items-center gap-1.5 border-t border-line px-4 pt-3 font-mono text-[11px] text-silver-500">
          <FileCode2
            aria-hidden
            className="size-3.5 shrink-0"
            strokeWidth={1.5}
          />
          <span className="truncate">Also reading {currentFile}</span>
        </p>
      )}
      <ChatComposer
        projectId={projectId}
        sessionId={active?.id ?? null}
        currentFile={currentFile}
        suggestions={!active || active.messages.length === 0 ? SUGGESTIONS : []}
      />
    </div>
  );
}
