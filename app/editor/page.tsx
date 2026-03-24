import { EditorWorkspace } from "@/components/EditorWorkspace";
import { AuthGate } from "@/components/AuthGate";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthGate title="Sign in to use the editor" description="Google authentication is required before you can create videos or reopen saved drafts.">
      <EditorWorkspace initialProjectId={params.project ?? null} />
    </AuthGate>
  );
}
