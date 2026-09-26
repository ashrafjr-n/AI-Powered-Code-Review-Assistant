import { FolderGit2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import type { NavLink } from "@/content/landing";

interface SiteFooterProps {
  tagline: string;
  note: string;
  links: NavLink[];
  repoUrl: string;
}

export function SiteFooter({ tagline, note, links, repoUrl }: SiteFooterProps) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1fr_auto_auto] md:gap-20 md:px-16">
        <div>
          <Logo className="h-6 w-auto" />
          <p className="mt-4 font-mono text-xs text-silver-500">{tagline}</p>
        </div>
        <nav aria-label="Footer">
          <p className="font-mono text-[11px] tracking-label text-silver-500 uppercase">
            Product
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-silver-400 transition-colors hover:text-paper"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="font-mono text-[11px] tracking-label text-silver-500 uppercase">
            Project
          </p>
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm text-silver-400 transition-colors hover:text-paper"
          >
            <FolderGit2 aria-hidden className="size-4" strokeWidth={1.5} />
            Source on GitHub
          </a>
        </div>
      </div>
      <p className="mx-auto max-w-[1200px] border-t border-line px-4 py-6 font-mono text-xs text-silver-500 sm:px-8 md:px-16">
        {note}
      </p>
    </footer>
  );
}
