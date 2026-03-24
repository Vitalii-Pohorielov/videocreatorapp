import { AuthGate } from "@/components/AuthGate";
import { ProjectsWorkspace } from "@/components/ProjectsWorkspace";

export default function ProjectsPage() {
  return (
    <AuthGate title="Sign in to manage ClipLab projects" description="Your saved ClipLab drafts live inside your authenticated workspace.">
      <ProjectsWorkspace />
    </AuthGate>
  );
}
