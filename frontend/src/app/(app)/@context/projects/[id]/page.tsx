import { ProjectContext } from "@/components/app/project-context";
import { getProject } from "@/lib/api/projects";

export default async function WorkspaceContext({
  params,
}: PageProps<"/projects/[id]">) {
  const project = await getProject((await params).id);
  if (!project) return null;
  return (
    <ProjectContext
      name={project.name}
      fileCount={project.fileCount}
      description={project.description}
      backHref="/projects"
      backLabel="Back to projects"
      asHeading
    />
  );
}
