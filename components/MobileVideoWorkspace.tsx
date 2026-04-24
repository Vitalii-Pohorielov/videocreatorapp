"use client";

import { EditorWorkspace } from "@/components/EditorWorkspace";

type MobileVideoWorkspaceProps = {
  initialProjectId?: string | null;
};

export function MobileVideoWorkspace({ initialProjectId = null }: MobileVideoWorkspaceProps) {
  return <EditorWorkspace initialProjectId={initialProjectId} workspaceBasePath="/mobile-video" exportMode="remotion-server" />;
}
