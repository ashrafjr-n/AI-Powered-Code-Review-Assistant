import { ProjectContext } from "@/components/app/project-context";
import { getProject } from "@/lib/api/projects";

export default async function ReportContext({
  params,
}: PageProps<"/projects/[id]/reviews/[reviewId]">) {
  const project = await getProject((await params).id);
  if (!project) return null;
  return (
    <ProjectContext
      name={project.name}
      fileCount={project.fileCount}
      description={project.description}
      backHref={`/projects/${project.id}`}
      backLabel={`Back to ${project.name}`}
      asHeading={false}
    />
  );
}
