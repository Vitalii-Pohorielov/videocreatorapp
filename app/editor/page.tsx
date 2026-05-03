import { AuthGate } from "@/components/AuthGate";
import { PromoEditorWorkspace } from "@/components/PromoEditorWorkspace";
import type { VideoType } from "@/store/useStore";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; videoType?: string; chooseVideoType?: string }>;
}) {
  const params = await searchParams;
  const initialVideoType: VideoType = params.videoType === "announcement" ? "announcement" : "promo";
  const openVideoTypeModal = params.chooseVideoType === "1" && !params.project;

  return (
    <AuthGate title="Sign in to use the editor" description="Google authentication is required before you can create videos or reopen saved drafts.">
      <PromoEditorWorkspace initialProjectId={params.project ?? null} initialVideoType={initialVideoType} openVideoTypeModal={openVideoTypeModal} />
    </AuthGate>
  );
}
