import { AuthGate } from "@/components/AuthGate";
import { BannerWorkspace } from "@/components/BannerWorkspace";

export default function BannerPage() {
  return (
    <AuthGate title="Sign in to create banners" description="Google authentication is required before you can open the banner builder.">
      <BannerWorkspace />
    </AuthGate>
  );
}
