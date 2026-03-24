"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { ExportSettings, SceneTrack } from "@/store/useStore";

const PROJECTS_TABLE = "video_projects";
const IMAGES_BUCKET = "project-images";

type PersistedProjectRow = {
  id: string;
  name: string;
  payload: PersistedProjectPayload;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PersistedProjectPayload = {
  version: 1;
  sceneTrack: SceneTrack;
  exportSettings: ExportSettings;
};

export async function uploadProjectImage(file: File) {
  const supabase = getSupabaseBrowserClient();
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? "webp" : "webp";
  const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "webp";
  const path = `uploads/${crypto.randomUUID()}.${safeExtension}`;

  const { error } = await supabase.storage.from(IMAGES_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function saveProject(input: {
  projectId: string | null;
  projectName: string;
  sceneTrack: SceneTrack;
  exportSettings: ExportSettings;
}) {
  const supabase = getSupabaseBrowserClient();
  const payload: PersistedProjectPayload = {
    version: 1,
    sceneTrack: input.sceneTrack,
    exportSettings: input.exportSettings,
  };

  const row = {
    id: input.projectId ?? crypto.randomUUID(),
    name: input.projectName.trim() || "Untitled project",
    payload,
    deleted: false,
  };

  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .upsert(row, { onConflict: "id" })
    .select("id, name, payload, updated_at")
    .single<PersistedProjectRow>();

  if (error) {
    throw new Error(`Project save failed: ${error.message}`);
  }

  return data;
}

export async function loadProject(projectId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .select("id, name, payload, updated_at")
    .eq("id", projectId)
    .eq("deleted", false)
    .single<PersistedProjectRow>();

  if (error) {
    throw new Error(`Project load failed: ${error.message}`);
  }

  return data;
}

export async function listProjects(limit = 24) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .select("id, name, created_at, updated_at")
    .eq("deleted", false)
    .order("updated_at", { ascending: false })
    .limit(limit)
    .returns<PersistedProjectRow[]>();

  if (error) {
    throw new Error(`Project list failed: ${error.message}`);
  }

  return data;
}

export async function deleteProject(projectId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .update({ deleted: true })
    .eq("id", projectId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`Project delete failed: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error("Project delete did not complete. Apply the updated schema from lib/projectSchema.sql first.");
  }
}
