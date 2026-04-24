import { AuthGate } from "@/components/AuthGate";
import { MobileVideoWorkspace } from "@/components/MobileVideoWorkspace";

export default async function MobileVideoPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthGate title="Sign in to use mobile video lab" description="Google authentication is required before you can create or reopen mobile video experiments.">
      <MobileVideoWorkspace initialProjectId={params.project ?? null} />
    </AuthGate>
  );
}
