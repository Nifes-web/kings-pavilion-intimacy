import fs from "fs";
import path from "path";
import { supabaseServer } from "@/lib/supabaseClient";

export interface MediaAsset {
  id: string;
  name: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  dimensions?: string;
  category: "flyer" | "logo" | "portrait" | "section" | "banner" | "video" | "general";
  alt_text?: string;
  description?: string;
  is_system?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AssetAssignment {
  url: string;
  alt: string;
  fit: "cover" | "contain" | "fill";
  position: "center" | "top" | "bottom" | "left" | "right";
  section_name: string;
  updated_at: string;
}

export type AssetAssignmentsMap = Record<string, AssetAssignment>;

const REGISTRY_FILE = path.join(process.cwd(), "src", "data", "mediaRegistry.json");
const ASSIGNMENTS_FILE = path.join(process.cwd(), "src", "data", "assetAssignments.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// ---------------------------------------------------------------------------
// 1. Media Assets Registry
// ---------------------------------------------------------------------------

export async function getMediaAssets(): Promise<MediaAsset[]> {
  // A. Try reading from Supabase if table exists
  try {
    const { data, error } = await supabaseServer
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as MediaAsset[];
    }
  } catch {
    // Graceful fallback
  }

  // B. Fallback to local file registry
  try {
    if (fs.existsSync(REGISTRY_FILE)) {
      const raw = fs.readFileSync(REGISTRY_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("[MediaService] Failed to read mediaRegistry.json:", err);
  }

  return [];
}

export async function saveMediaAsset(asset: MediaAsset): Promise<MediaAsset> {
  // A. Try saving to Supabase
  try {
    await supabaseServer
      .from("media_assets")
      .upsert(asset);
  } catch {
    // Fail gracefully to local file
  }

  // B. Save to local registry file
  try {
    const assets = await getMediaAssets();
    const existingIdx = assets.findIndex((a) => a.id === asset.id);
    if (existingIdx >= 0) {
      assets[existingIdx] = { ...assets[existingIdx], ...asset, updated_at: new Date().toISOString() };
    } else {
      assets.unshift(asset);
    }
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(assets, null, 2), "utf8");
  } catch (err) {
    console.error("[MediaService] Failed to persist asset locally:", err);
  }

  return asset;
}

export async function deleteMediaAsset(assetId: string): Promise<{ success: boolean; error?: string }> {
  const assets = await getMediaAssets();
  const target = assets.find((a) => a.id === assetId);

  if (!target) {
    return { success: false, error: "Asset not found" };
  }

  if (target.is_system) {
    return { success: false, error: "System assets cannot be deleted. You may replace their assignment instead." };
  }

  // Check if currently assigned
  const assignments = await getAssetAssignments();
  const isAssigned = Object.values(assignments).some((v) => v.url === target.url);
  if (isAssigned) {
    return {
      success: false,
      error: "This asset is currently assigned to a live website section. Please reassign the section first.",
    };
  }

  // Delete local file if in /uploads/
  if (target.url.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", target.url.replace(/^\//, ""));
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn("[MediaService] Could not delete physical file:", err);
      }
    }
  }

  // Remove from Supabase
  try {
    await supabaseServer.from("media_assets").delete().eq("id", assetId);
  } catch {
    // Silent
  }

  // Remove from local registry
  try {
    const updated = assets.filter((a) => a.id !== assetId);
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(updated, null, 2), "utf8");
  } catch (err) {
    console.error("[MediaService] Failed to remove asset from registry file:", err);
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// 2. Visual Asset Assignments
// ---------------------------------------------------------------------------

export async function getAssetAssignments(): Promise<AssetAssignmentsMap> {
  // A. Try Supabase site_settings
  try {
    const { data, error } = await supabaseServer
      .from("site_settings")
      .select("value")
      .eq("key", "asset_assignments")
      .maybeSingle();

    if (!error && data?.value && Object.keys(data.value).length > 0) {
      return data.value as AssetAssignmentsMap;
    }
  } catch {
    // Fallback
  }

  // B. Fallback to local JSON
  try {
    if (fs.existsSync(ASSIGNMENTS_FILE)) {
      const raw = fs.readFileSync(ASSIGNMENTS_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("[MediaService] Failed to read assetAssignments.json:", err);
  }

  return {};
}

export async function saveAssetAssignment(
  slotKey: string,
  data: Partial<AssetAssignment>
): Promise<AssetAssignmentsMap> {
  const current = await getAssetAssignments();
  const existing = current[slotKey] || {
    url: "/assets/intimacy-flyer.jpg",
    alt: "King's Pavilion Asset",
    fit: "cover",
    position: "center",
    section_name: slotKey,
    updated_at: new Date().toISOString(),
  };

  current[slotKey] = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };

  // Persist to Supabase site_settings
  try {
    await supabaseServer.from("site_settings").upsert({
      key: "asset_assignments",
      value: current,
      is_public: true,
      description: "Visual media asset assignments for live website sections",
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Silent fallback
  }

  // Persist locally
  try {
    fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(current, null, 2), "utf8");
  } catch (err) {
    console.error("[MediaService] Failed to write assetAssignments.json:", err);
  }

  return current;
}

// ---------------------------------------------------------------------------
// 3. File Upload Handler (Validated & Secure)
// ---------------------------------------------------------------------------

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
]);

const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export async function processMediaUpload({
  buffer,
  originalFilename,
  mimeType,
  category = "general",
  altText = "",
  description = "",
  width,
  height,
}: {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
  category?: MediaAsset["category"];
  altText?: string;
  description?: string;
  width?: number;
  height?: number;
}): Promise<{ success: boolean; asset?: MediaAsset; error?: string }> {
  // 1. Validate MIME
  if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
    return {
      success: false,
      error: `Unsupported file type: ${mimeType}. Allowed formats: JPG, PNG, WebP, SVG, MP4.`,
    };
  }

  // 2. Validate Size
  const isVideo = mimeType === "video/mp4";
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (buffer.length > maxSize) {
    return {
      success: false,
      error: `File size (${(buffer.length / 1024 / 1024).toFixed(1)}MB) exceeds maximum allowed limit of ${maxSize / 1024 / 1024}MB.`,
    };
  }

  // 3. Clean filename and generate unique identifier
  const ext = path.extname(originalFilename).toLowerCase() || (isVideo ? ".mp4" : ".jpg");
  const baseName = path
    .basename(originalFilename, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .toLowerCase()
    .slice(0, 50);

  const timestamp = Date.now();
  const cleanFilename = `${baseName}-${timestamp}${ext}`;

  // 4. Determine destination (Supabase Storage vs Local Uploads)
  let publicUrl = `/uploads/${cleanFilename}`;
  let storageSuccess = false;

  try {
    // Check if remote 'media' bucket exists
    const { data: buckets } = await supabaseServer.storage.listBuckets();
    const mediaBucket = buckets?.find((b) => b.id === "media" || b.name === "media");

    if (mediaBucket) {
      const { data: uploadData, error: uploadErr } = await supabaseServer.storage
        .from("media")
        .upload(cleanFilename, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!uploadErr && uploadData?.path) {
        const { data: publicUrlData } = supabaseServer.storage
          .from("media")
          .getPublicUrl(uploadData.path);

        if (publicUrlData?.publicUrl) {
          publicUrl = publicUrlData.publicUrl;
          storageSuccess = true;
        }
      }
    }
  } catch {
    // Fall back to local
  }

  // 5. If not stored in Supabase Storage, write to public/uploads
  if (!storageSuccess) {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    const targetPath = path.join(UPLOADS_DIR, cleanFilename);
    fs.writeFileSync(targetPath, buffer);
  }

  // 6. Build MediaAsset
  const dimStr = width && height ? `${width} x ${height}` : undefined;
  const newAsset: MediaAsset = {
    id: `asset-${timestamp}`,
    name: path.basename(originalFilename, ext),
    filename: cleanFilename,
    url: publicUrl,
    type: mimeType,
    size: buffer.length,
    dimensions: dimStr,
    category,
    alt_text: altText || originalFilename,
    description: description || `Uploaded asset for ${category}`,
    is_system: false,
    created_at: new Date().toISOString(),
  };

  await saveMediaAsset(newAsset);

  return { success: true, asset: newAsset };
}

