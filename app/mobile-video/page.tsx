import { AuthGate } from "@/components/AuthGate";
import { EditorWorkspace } from "@/components/EditorWorkspace";

export default async function MobileVideoPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthGate title="Sign in to use mobile video lab" description="Google authentication is required before you can create or reopen mobile video experiments.">
      <EditorWorkspace initialProjectId={params.project ?? null} workspaceBasePath="/mobile-video" exportMode="remotion-server" />
    </AuthGate>
  );
}
