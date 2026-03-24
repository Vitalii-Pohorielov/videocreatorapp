import { EditorWorkspace } from "@/components/EditorWorkspace";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const params = await searchParams;

  return <EditorWorkspace initialProjectId={params.project ?? null} />;
}
