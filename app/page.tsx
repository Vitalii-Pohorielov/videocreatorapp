import { redirect } from "next/navigation";

import { ProjectsWorkspace } from "@/components/ProjectsWorkspace";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const params = await searchParams;

  if (params.project) {
    redirect(`/editor?project=${params.project}`);
  }

  return <ProjectsWorkspace />;
}
