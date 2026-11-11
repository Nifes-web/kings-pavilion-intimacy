import fs from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ASSIGNMENTS_FILE = path.join(process.cwd(), "src", "data", "assetAssignments.json");

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function fetchRoute(routePath) {
  const url = `${BASE_URL}${routePath}`;
  const res = await fetch(url, {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
  const text = await res.text();
  return { status: res.status, text };
}

function updateLocalAssignment(slotKey, url, alt = "Test Logo") {
  const raw = fs.readFileSync(ASSIGNMENTS_FILE, "utf8");
  const data = JSON.parse(raw);
  data[slotKey] = {
    url,
    alt,
    fit: "contain",
    position: "center",
    section_name: "Website Header & Footer Logo",
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(ASSIGNMENTS_FILE, JSON.stringify(data, null, 2), "utf8");
}

async function runTest() {
  console.log("=== KING'S PAVILION GLOBAL LOGO SYNCHRONISATION AUDIT ===");
  console.log(`Target Base URL: ${BASE_URL}`);

  // Backup existing assignment
  const originalRaw = fs.readFileSync(ASSIGNMENTS_FILE, "utf8");
  const originalData = JSON.parse(originalRaw);
  const originalLogoUrl = originalData.website_logo?.url || "/assets/kings-pavilion-logo-cropped.png";
  console.log(`Original Assigned Logo URL: ${originalLogoUrl}`);

  try {
    // -------------------------------------------------------------
    // Test 1: Public Branding Endpoint Verification
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: Public Branding API (/api/branding) ---");
    const brandingRes = await fetch(`${BASE_URL}/api/branding`, { cache: "no-store" });
    assert(brandingRes.status === 200, "GET /api/branding returned HTTP 200 OK");
    const brandingJson = await brandingRes.json();
    assert(brandingJson.success === true, "Branding API returned success: true");
    assert(Boolean(brandingJson.branding?.logoUrl), `Branding logoUrl resolved: ${brandingJson.branding?.logoUrl}`);
    assert(brandingJson.branding.logoUrl === originalLogoUrl, "Branding API matches assetAssignments.json");

    // -------------------------------------------------------------
    // Test 2: Multi-Page Initial Logo Consistency Audit
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Multi-Page Initial Consistency Audit ---");
    const routesToTest = [
      "/",
      "/ministers",
      "/testimonies",
      "/testimonies/sample-breakthrough-in-prayer",
      "/register",
      "/volunteer",
      "/login",
      "/reset-password",
    ];

    for (const route of routesToTest) {
      const { status, text } = await fetchRoute(route);
      assert(status === 200, `Route '${route}' rendered HTTP 200`);
      // Escaped URL or normal URL match
      const encodedOriginal = encodeURIComponent(originalLogoUrl).slice(0, 20);
      const hasLogo = text.includes(originalLogoUrl) || text.includes(encodedOriginal);
      assert(hasLogo, `Route '${route}' contains central assigned logo: ${originalLogoUrl}`);
    }

    // -------------------------------------------------------------
    // Test 3: Dynamic Logo Replacement (Cycle 1)
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Dynamic Logo Replacement (Cycle 1) ---");
    const testLogoUrl1 = "/uploads/test-synced-brand-logo-phase2.png";
    updateLocalAssignment("website_logo", testLogoUrl1, "Dynamic Synced Logo Alpha");

    // Verify /api/branding immediately reflects new logo
    const cycle1Res = await fetch(`${BASE_URL}/api/branding`, { cache: "no-store" });
    const cycle1Json = await cycle1Res.json();
    assert(cycle1Json.branding.logoUrl === testLogoUrl1, `API reflects new assignment: ${testLogoUrl1}`);

    // Verify all routes reflect the new logo on page request
    for (const route of routesToTest) {
      const { status, text } = await fetchRoute(route);
      assert(status === 200, `Route '${route}' rendered HTTP 200 after cycle 1 update`);
      const hasNewLogo = text.includes(testLogoUrl1) || text.includes(encodeURIComponent(testLogoUrl1).slice(0, 20));
      assert(hasNewLogo, `Route '${route}' successfully synchronized to new logo: ${testLogoUrl1}`);
    }

    // -------------------------------------------------------------
    // Test 4: Dynamic Logo Replacement (Cycle 2 - Successive Update)
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Dynamic Logo Replacement (Cycle 2 - Successive Update) ---");
    const testLogoUrl2 = "/uploads/second-change-brand-logo.png";
    updateLocalAssignment("website_logo", testLogoUrl2, "Dynamic Synced Logo Beta");

    const cycle2Res = await fetch(`${BASE_URL}/api/branding`, { cache: "no-store" });
    const cycle2Json = await cycle2Res.json();
    assert(cycle2Json.branding.logoUrl === testLogoUrl2, `API reflects second assignment: ${testLogoUrl2}`);

    for (const route of routesToTest) {
      const { status, text } = await fetchRoute(route);
      assert(status === 200, `Route '${route}' rendered HTTP 200 after cycle 2 update`);
      const hasSecondLogo = text.includes(testLogoUrl2) || text.includes(encodeURIComponent(testLogoUrl2).slice(0, 20));
      assert(hasSecondLogo, `Route '${route}' successfully synchronized to second logo: ${testLogoUrl2}`);
    }

    // -------------------------------------------------------------
    // Test 5: Clean Restoration to Original Logo
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Clean Restoration to Original Logo ---");
    fs.writeFileSync(ASSIGNMENTS_FILE, originalRaw, "utf8");

    const restoreRes = await fetch(`${BASE_URL}/api/branding`, { cache: "no-store" });
    const restoreJson = await restoreRes.json();
    assert(restoreJson.branding.logoUrl === originalLogoUrl, `API restored to original logo: ${originalLogoUrl}`);

    for (const route of routesToTest) {
      const { status, text } = await fetchRoute(route);
      assert(status === 200, `Route '${route}' rendered HTTP 200 after restoration`);
      const hasRestoredLogo = text.includes(originalLogoUrl) || text.includes(encodeURIComponent(originalLogoUrl).slice(0, 20));
      assert(hasRestoredLogo, `Route '${route}' confirmed restored to: ${originalLogoUrl}`);
    }

    console.log("\n=======================================================");
    console.log("🎉 ALL GLOBAL LOGO SYNCHRONISATION TESTS PASSED (100%)");
    console.log("=======================================================");
  } catch (err) {
    console.error("Test execution failed:", err);
    // Ensure restoration on error
    fs.writeFileSync(ASSIGNMENTS_FILE, originalRaw, "utf8");
    process.exit(1);
  }
}

runTest();
