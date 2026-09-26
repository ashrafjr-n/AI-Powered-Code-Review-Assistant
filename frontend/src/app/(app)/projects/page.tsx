import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Projects" };

// Shell only (F3). The page content is built in its own phase.
export default function ProjectsPage() {
  return (
    <PageHeader
      title="Projects"
      description="Your codebases and their reviews."
    />
  );
}
