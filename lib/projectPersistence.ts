"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { BannerDraft } from "@/lib/bannerDefinitions";
import type { BannerStylePresetId } from "@/lib/bannerStylePresets";
import type { ExportSettings, SceneTrack } from "@/store/useStore";

const VIDEO_PROJECTS_TABLE = "video_projects";
const BANNER_PROJECTS_TABLE = "banner_projects";
const IMAGES_BUCKET = "project-images";

type PersistedVideoProjectRow = {
  id: string;
  name: string;
  payload: PersistedProjectPayload;
  user_id?: string | null;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

type PersistedBannerProjectRow = {
  id: string;
  name: string;
  payload: PersistedBannerPayload;
  user_id?: string | null;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PersistedProjectPayload = {
  version: 1;
  sceneTrack: SceneTrack;
  exportSettings: ExportSettings;
};

export type PersistedBannerPayload = {
  version: 1;
  draft: BannerDraft;
  stylePresetId: BannerStylePresetId;
  bannerPositionIndex: number;
  bannerAssetVariantIndex: number;
};

function getMissingSchemaMessage(target: "video project" | "banner project") {
  return `${target[0].toUpperCase()}${target.slice(1)} storage is not ready yet. Apply the updated schema from lib/projectSchema.sql first.`;
}

async function getAuthenticatedSupabase() {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }

  if (!session?.user) {
    throw new Error("Sign in with Google to access cloud projects.");
  }

  return { supabase, user: session.user };
}

export async function uploadProjectImage(file: File) {
  const { supabase, user } = await getAuthenticatedSupabase();
  const extension = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? "webp" : "webp";
  const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "webp";
  const path = `${user.id}/uploads/${crypto.randomUUID()}.${safeExtension}`;

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
  const { supabase, user } = await getAuthenticatedSupabase();
  const payload: PersistedProjectPayload = {
    version: 1,
    sceneTrack: input.sceneTrack,
    exportSettings: input.exportSettings,
  };

  const row = {
    id: input.projectId ?? crypto.randomUUID(),
    user_id: user.id,
    name: input.projectName.trim() || "Untitled project",
    payload,
    deleted: false,
  };

  const { data, error } = await supabase
    .from(VIDEO_PROJECTS_TABLE)
    .upsert(row, { onConflict: "id" })
    .select("id, name, payload, updated_at")
    .single<PersistedVideoProjectRow>();

  if (error) {
    throw new Error(`Project save failed: ${error.message}`);
  }

  return data;
}

export async function loadProject(projectId: string) {
  const { supabase } = await getAuthenticatedSupabase();
  const { data, error } = await supabase
    .from(VIDEO_PROJECTS_TABLE)
    .select("id, name, payload, updated_at")
    .eq("id", projectId)
    .eq("deleted", false)
    .single<PersistedVideoProjectRow>();

  if (error) {
    throw new Error(`Project load failed: ${error.message}`);
  }

  return data;
}

export async function listProjects(limit = 24) {
  const { supabase } = await getAuthenticatedSupabase();
  const { data, error } = await supabase
    .from(VIDEO_PROJECTS_TABLE)
    .select("id, name, created_at, updated_at")
    .eq("deleted", false)
    .order("updated_at", { ascending: false })
    .limit(limit)
    .returns<PersistedVideoProjectRow[]>();

  if (error) {
    throw new Error(`Project list failed: ${error.message}`);
  }

  return data;
}

export async function deleteProject(projectId: string) {
  const { supabase } = await getAuthenticatedSupabase();
  const { data, error } = await supabase
    .from(VIDEO_PROJECTS_TABLE)
    .update({ deleted: true })
    .eq("id", projectId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`Project delete failed: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error(getMissingSchemaMessage("video project"));
  }
}

export async function deleteProjects(projectIds: string[]) {
  if (projectIds.length === 0) return;

  const { supabase } = await getAuthenticatedSupabase();
  const { data, error } = await supabase
    .from(VIDEO_PROJECTS_TABLE)
    .update({ deleted: true })
    .in("id", projectIds)
    .select("id")
    .returns<{ id: string }[]>();

  if (error) {
    throw new Error(`Project delete failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(getMissingSchemaMessage("video project"));
  }
}

export async function saveBannerProject(input: {
  projectId: string | null;
  projectName: string;
  draft: BannerDraft;
  stylePresetId: BannerStylePresetId;
  bannerPositionIndex: number;
  bannerAssetVariantIndex: number;
}) {
  const { supabase, user } = await getAuthenticatedSupabase();
  const payload: PersistedBannerPayload = {
    version: 1,
    draft: input.draft,
    stylePresetId: input.stylePresetId,
    bannerPositionIndex: input.bannerPositionIndex,
    bannerAssetVariantIndex: input.bannerAssetVariantIndex,
  };

  const row = {
    id: input.projectId ?? crypto.randomUUID(),
    user_id: user.id,
    name: input.projectName.trim() || "Untitled banner",
    payload,
    deleted: false,
  };

  const { data, error } = await supabase
    .from(BANNER_PROJECTS_TABLE)
    .upsert(row, { onConflict: "id" })
    .select("id, name, payload, updated_at")
    .single<PersistedBannerProjectRow>();

  if (error) {
    throw new Error(`Banner save failed: ${error.message}`);
  }

  return data;
}

export async function loadBannerProject(projectId: string) {
  const { supabase } = await getAuthenticatedSupabase();
  const { data, error } = await supabase
    .from(BANNER_PROJECTS_TABLE)
    .select("id, name, payload, updated_at")
    .eq("id", projectId)
    .eq("deleted", false)
    .single<PersistedBannerProjectRow>();

  if (error) {
    throw new Error(`Banner load failed: ${error.message}`);
  }

  return data;
}

export async function listBannerProjects(limit = 24) {
  const { supabase } = await getAuthenticatedSupabase();
  const { data, error } = await supabase
    .from(BANNER_PROJECTS_TABLE)
    .select("id, name, created_at, updated_at")
    .eq("deleted", false)
    .order("updated_at", { ascending: false })
    .limit(limit)
    .returns<PersistedBannerProjectRow[]>();

  if (error) {
    throw new Error(`Banner list failed: ${error.message}`);
  }

  return data;
}

export async function deleteBannerProject(projectId: string) {
  const { supabase } = await getAuthenticatedSupabase();
  const { data, error } = await supabase
    .from(BANNER_PROJECTS_TABLE)
    .update({ deleted: true })
    .eq("id", projectId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`Banner delete failed: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error(getMissingSchemaMessage("banner project"));
  }
}

export async function deleteBannerProjects(projectIds: string[]) {
  if (projectIds.length === 0) return;

  const { supabase } = await getAuthenticatedSupabase();
  const { data, error } = await supabase
    .from(BANNER_PROJECTS_TABLE)
    .update({ deleted: true })
    .in("id", projectIds)
    .select("id")
    .returns<{ id: string }[]>();

  if (error) {
    throw new Error(`Banner delete failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(getMissingSchemaMessage("banner project"));
  }
}
