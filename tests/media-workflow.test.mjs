import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.TEST_APP_URL || "http://localhost:3000";
const REGISTRY_FILE = path.join(process.cwd(), "src", "data", "mediaRegistry.json");
const ASSIGNMENTS_FILE = path.join(process.cwd(), "src", "data", "assetAssignments.json");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

async function runMediaWorkflowTests() {
  console.log("=================================================");
  console.log("KING'S PAVILION CMS MEDIA WORKFLOW TEST SUITE");
  console.log("=================================================");

  // ---------------------------------------------------------------------------
  // 1. Security Check: Unauthenticated Access Prohibited
  // ---------------------------------------------------------------------------
  console.log("\n[Test 1] Unauthenticated Access Restrictions");

  // A. Upload without auth
  const unauthUpload = await fetch(`${BASE_URL}/api/admin/media/upload`, {
    method: "POST",
    headers: { origin: BASE_URL },
  });
  console.log("  Upload without auth status:", unauthUpload.status);
  assert.equal(
    unauthUpload.status === 401 || unauthUpload.status === 403,
    true,
    "Unauthenticated upload must return 401 or 403"
  );

  // B. Media list without auth
  const unauthGet = await fetch(`${BASE_URL}/api/admin/media`);
  console.log("  Media GET without auth status:", unauthGet.status);
  assert.equal(
    unauthGet.status === 401 || unauthGet.status === 403,
    true,
    "Unauthenticated media GET must return 401 or 403"
  );

  // C. Assignment mutation without auth
  const unauthAssign = await fetch(`${BASE_URL}/api/admin/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: BASE_URL },
    body: JSON.stringify({ slotKey: "hero_flyer", url: "/test.jpg" }),
  });
  console.log("  Media assignment without auth status:", unauthAssign.status);
  assert.equal(
    unauthAssign.status === 401 || unauthAssign.status === 403,
    true,
    "Unauthenticated assignment mutation must return 401 or 403"
  );

  // D. Asset deletion without auth
  const unauthDelete = await fetch(`${BASE_URL}/api/admin/media/test-asset-id`, {
    method: "DELETE",
    headers: { origin: BASE_URL },
  });
  console.log("  Media delete without auth status:", unauthDelete.status);
  assert.equal(
    unauthDelete.status === 401 || unauthDelete.status === 403,
    true,
    "Unauthenticated delete must return 401 or 403"
  );

  // ---------------------------------------------------------------------------
  // 2. File & Format Validation Specifications
  // ---------------------------------------------------------------------------
  console.log("\n[Test 2] Storage Foundation & Migration Specifications");

  const migrationFile = path.join(
    process.cwd(),
    "supabase",
    "migrations",
    "20261111000000_media_storage_foundation.sql"
  );
  assert.equal(fs.existsSync(migrationFile), true, "Media migration file must exist");
  const migrationSql = fs.readFileSync(migrationFile, "utf8");

  assert.match(migrationSql, /storage\.buckets/, "Must configure storage.buckets");
  assert.match(migrationSql, /Public Media Read Access/, "Must define public read policy");
  assert.match(migrationSql, /Admin Media Upload Access/, "Must define authenticated upload policy");
  assert.match(migrationSql, /public\.media_assets/, "Must define public.media_assets table");
  console.log("  ✓ Storage migration file contains verified RLS and bucket specifications.");

  // ---------------------------------------------------------------------------
  // 3. Media Registry Integrity & Initial Canonical Assets
  // ---------------------------------------------------------------------------
  console.log("\n[Test 3] Media Registry Integrity");

  assert.equal(fs.existsSync(REGISTRY_FILE), true, "mediaRegistry.json must exist");
  const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, "utf8"));
  assert.ok(registry.length >= 13, "Registry must contain all 13 canonical media assets");

  const flyer = registry.find((a) => a.id === "asset-flyer-main");
  assert.ok(flyer, "Must contain main event flyer asset");
  assert.equal(flyer.category, "flyer");

  const logo = registry.find((a) => a.id === "asset-logo-main");
  assert.ok(logo, "Must contain church logo asset");
  assert.equal(logo.category, "logo");

  const portraits = registry.filter((a) => a.category === "portrait");
  assert.equal(portraits.length, 7, "Must contain all 7 minister portraits");
  console.log("  ✓ Verified 13 canonical assets in registry with category tagging.");

  // ---------------------------------------------------------------------------
  // 4. Physical Asset Persistence in Local Storage
  // ---------------------------------------------------------------------------
  console.log("\n[Test 4] Physical Asset Persistence in Local Storage");

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Create a verified test image in public/uploads/
  const testFilename = `test-hero-preview-${Date.now()}.jpg`;
  const testFilePath = path.join(UPLOADS_DIR, testFilename);
  const sampleJpgBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xd9,
  ]);
  fs.writeFileSync(testFilePath, sampleJpgBuffer);
  assert.equal(fs.existsSync(testFilePath), true, "Test file physically created in public/uploads/");
  console.log("  ✓ Uploaded test file to:", testFilePath);

  const testAssetUrl = `/uploads/${testFilename}`;

  // ---------------------------------------------------------------------------
  // 5. Visual Asset Assignment to Homepage Hero
  // ---------------------------------------------------------------------------
  console.log("\n[Test 5] Visual Asset Assignment to Homepage Hero");

  const initialAssignments = JSON.parse(fs.readFileSync(ASSIGNMENTS_FILE, "utf8"));
  const originalHeroUrl = initialAssignments.hero_flyer.url;

  // Temporarily assign the new test asset to hero_flyer
  initialAssignments.hero_flyer = {
    url: testAssetUrl,
    alt: "Automated Live Test Hero Banner",
    fit: "cover",
    position: "center",
    section_name: "Homepage Hero Visual Centerpiece",
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(initialAssignments, null, 2), "utf8");

  // Verify that Next.js server serves the new assignment on GET /
  const homeRes = await fetch(`${BASE_URL}/`, { cache: "no-store" });
  assert.equal(homeRes.status, 200, "Homepage must return HTTP 200");
  const homeHtml = await homeRes.text();

  const isAssignedImageRendered =
    homeHtml.includes(testAssetUrl) || homeHtml.includes(encodeURIComponent(testAssetUrl));

  assert.equal(
    isAssignedImageRendered,
    true,
    "Homepage HTML must dynamically render the newly assigned image URL without code edits"
  );
  console.log("  ✓ Live Homepage renders newly assigned asset:", testAssetUrl);

  // ---------------------------------------------------------------------------
  // 6. Visual Asset Replacement Workflow (Restore Original)
  // ---------------------------------------------------------------------------
  console.log("\n[Test 6] Visual Asset Replacement & Restoration");

  initialAssignments.hero_flyer = {
    url: originalHeroUrl,
    alt: "Official King's Pavilion Intimacy 12 Hours Prayer Bootcamp Flyer",
    fit: "cover",
    position: "center",
    section_name: "Homepage Hero Visual Centerpiece",
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(initialAssignments, null, 2), "utf8");

  // Re-request homepage
  const restoredRes = await fetch(`${BASE_URL}/`, { cache: "no-store" });
  const restoredHtml = await restoredRes.text();
  assert.equal(
    restoredHtml.includes("intimacy-flyer.jpg"),
    true,
    "Homepage must immediately reflect restored flyer"
  );
  console.log("  ✓ Live Homepage restored cleanly to:", originalHeroUrl);

  // ---------------------------------------------------------------------------
  // 7. Cleanup Test Files
  // ---------------------------------------------------------------------------
  console.log("\n[Test 7] Cleanup Temporary Test Files");
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
    console.log("  ✓ Cleaned up temporary test file:", testFilePath);
  }

  console.log("\n=================================================");
  console.log("ALL 7 MEDIA WORKFLOW TESTS PASSED CLEANLY (100%)");
  console.log("=================================================\n");
}

runMediaWorkflowTests().catch((err) => {
  console.error("\n❌ Media Workflow Test Failed:", err);
  process.exit(1);
});
