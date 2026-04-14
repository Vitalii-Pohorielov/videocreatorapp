import { AuthGate } from "@/components/AuthGate";
import { BannerWorkspace } from "@/components/BannerWorkspace";

export default async function BannerPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthGate title="Sign in to create banners" description="Google authentication is required before you can open the banner builder.">
      <BannerWorkspace initialProjectId={params.project ?? null} />
    </AuthGate>
  );
}
