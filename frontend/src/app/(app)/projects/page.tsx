import type { Metadata } from "next";
import { FolderPlus } from "lucide-react";
import { NewProjectDialog } from "@/components/projects/new-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { projectsCopy } from "@/content/projects";
import { listProjects } from "@/mocks/projects";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const projects = await listProjects();
  const newProject = <NewProjectDialog label={projectsCopy.newProject} />;

  return (
    <div className="space-y-8">
      <PageHeader
        title={projectsCopy.title}
        description={projectsCopy.description}
        actions={projects.length > 0 ? newProject : undefined}
      />
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title={projectsCopy.empty.title}
          body={projectsCopy.empty.body}
          action={newProject}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </ul>
      )}
    </div>
  );
}
