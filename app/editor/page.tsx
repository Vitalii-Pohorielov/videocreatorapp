import { EditorWorkspace } from "@/components/EditorWorkspace";
import { AuthGate } from "@/components/AuthGate";
import type { VideoType } from "@/store/useStore";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; videoType?: string }>;
}) {
  const params = await searchParams;
  const initialVideoType: VideoType = params.videoType === "announcement" ? "announcement" : "promo";

  return (
    <AuthGate
      title="Sign in to use the editor"
      description="Google authentication is required before you can create videos or reopen saved drafts."
      requirePremium
      premiumTitle="Premium access required"
      premiumDescription="This editor is available only for users with the premium flag enabled in Supabase."
    >
      <EditorWorkspace initialProjectId={params.project ?? null} initialVideoType={initialVideoType} />
    </AuthGate>
  );
}
