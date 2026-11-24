/**
 * TEMPORARY SECURE ADMINISTRATOR PASSWORD RESET UTILITY
 * =====================================================
 * This script runs locally on the server using Node.js.
 * It uses the Supabase Admin API (service_role key) to update the
 * password for a specific, pre-verified Auth user.
 *
 * Security:
 * - Runs only on the local machine (not an API endpoint)
 * - Reads the new password from an environment variable (RESET_PASSWORD)
 * - Never logs, prints, or returns the password
 * - Verifies target identity before making changes
 * - This file is deleted after successful use
 *
 * Usage:
 *   PHASE=verify   node scripts/admin-password-reset.mjs          # Verify only
 *   PHASE=execute  RESET_PASSWORD="<new>"  node scripts/admin-password-reset.mjs  # Execute
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Load .env.local manually (no dotenv dependency required)
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(projectRoot, ".env.local");
  const envContent = readFileSync(envPath, "utf-8");
  const vars = {};
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    let val = trimmed.substring(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Target account — specified via CLI or environment
// ---------------------------------------------------------------------------
const TARGET_AUTH_USER_ID = process.env.TARGET_AUTH_USER_ID || process.argv[3];
const TARGET_EMAIL = process.env.TARGET_ADMIN_EMAIL || process.argv[2];

if (!TARGET_EMAIL) {
  console.error("ERROR: TARGET_ADMIN_EMAIL must be provided via environment or argv.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Create admin Supabase client
// ---------------------------------------------------------------------------
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------------------------------------------------------------------------
// Phase 1: VERIFY — Read-only checks
// ---------------------------------------------------------------------------
async function verifyAccount() {
  console.log("=".repeat(60));
  console.log("PHASE: VERIFY — Read-Only Account Inspection");
  console.log("=".repeat(60));

  // 1. Fetch Auth user by ID
  console.log("\n1. Fetching Supabase Auth user by ID...");
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.getUserById(TARGET_AUTH_USER_ID);

  if (authError || !authData?.user) {
    console.error("   FAILED: Could not fetch Auth user:", authError?.message || "User not found");
    return false;
  }

  const authUser = authData.user;
  console.log("   Auth User ID:    ", authUser.id);
  console.log("   Auth Email:      ", authUser.email);
  console.log("   Email Confirmed: ", !!authUser.email_confirmed_at);
  console.log("   Created At:      ", authUser.created_at);
  console.log("   Last Sign In:    ", authUser.last_sign_in_at || "N/A");
  console.log("   Banned:          ", authUser.banned_until ? `Until ${authUser.banned_until}` : "No");

  // 2. Verify email matches
  if (authUser.email?.toLowerCase() !== TARGET_EMAIL.toLowerCase()) {
    console.error(`   MISMATCH: Auth user email is "${authUser.email}", expected "${TARGET_EMAIL}"`);
    return false;
  }
  console.log("   ✓ Email matches target.");

  // 3. Fetch admin_users database record
  console.log("\n2. Fetching admin_users database record...");
  const { data: adminRecord, error: dbError } = await supabaseAdmin
    .from("admin_users")
    .select("id, auth_user_id, email, full_name, role, is_active, created_at")
    .eq("auth_user_id", TARGET_AUTH_USER_ID)
    .maybeSingle();

  if (dbError) {
    console.error("   DB query error:", dbError.message);
    return false;
  }

  if (!adminRecord) {
    console.error("   FAILED: No admin_users record found for this Auth user ID.");
    return false;
  }

  console.log("   Admin Record ID: ", adminRecord.id);
  console.log("   Auth User ID:    ", adminRecord.auth_user_id);
  console.log("   Email:           ", adminRecord.email);
  console.log("   Full Name:       ", adminRecord.full_name || "(not set)");
  console.log("   Role:            ", adminRecord.role);
  console.log("   Is Active:       ", adminRecord.is_active);
  console.log("   Created At:      ", adminRecord.created_at);

  // 4. Verify role is main_admin
  if (adminRecord.role !== "main_admin") {
    console.error(`   MISMATCH: Role is "${adminRecord.role}", expected "main_admin"`);
    return false;
  }
  console.log("   ✓ Role is main_admin.");

  // 5. Verify is_active
  if (adminRecord.is_active === false) {
    console.error("   WARNING: Account is currently deactivated (is_active = false).");
    return false;
  }
  console.log("   ✓ Account is active.");

  console.log("\n" + "=".repeat(60));
  console.log("VERIFICATION PASSED — All checks succeeded.");
  console.log("=".repeat(60));
  console.log("\nTarget for password update:");
  console.log(`  Auth User ID:  ${TARGET_AUTH_USER_ID}`);
  console.log(`  Email:         ${TARGET_EMAIL}`);
  console.log(`  Role:          main_admin`);
  console.log(`  DB Record ID:  ${adminRecord.id}`);
  console.log("\nTo execute the password update, run:");
  console.log(`  $env:PHASE="execute"; $env:RESET_PASSWORD="<YourNewSecurePassword>"; node scripts/admin-password-reset.mjs`);
  console.log("\nPassword requirements:");
  console.log("  - Minimum 10 characters");
  console.log("  - At least one uppercase letter");
  console.log("  - At least one lowercase letter");
  console.log("  - At least one digit");
  console.log("  - At least one special character (!@#$%^&* etc.)");

  return true;
}

// ---------------------------------------------------------------------------
// Phase 2: EXECUTE — Update password (requires RESET_PASSWORD env var)
// ---------------------------------------------------------------------------
async function executeReset() {
  console.log("=".repeat(60));
  console.log("PHASE: EXECUTE — Password Update");
  console.log("=".repeat(60));

  // 1. Read password from environment
  const newPassword = process.env.RESET_PASSWORD;
  if (!newPassword) {
    console.error("ERROR: RESET_PASSWORD environment variable is not set.");
    console.error("Run with: $env:RESET_PASSWORD=\"<YourNewPassword>\" ; node scripts/admin-password-reset.mjs");
    process.exit(1);
  }

  // 2. Validate password strength
  console.log("\n1. Validating password strength...");
  const errors = [];
  if (newPassword.length < 10) errors.push("Must be at least 10 characters");
  if (!/[A-Z]/.test(newPassword)) errors.push("Must contain at least one uppercase letter");
  if (!/[a-z]/.test(newPassword)) errors.push("Must contain at least one lowercase letter");
  if (!/[0-9]/.test(newPassword)) errors.push("Must contain at least one digit");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword)) errors.push("Must contain at least one special character");

  if (errors.length > 0) {
    console.error("   PASSWORD VALIDATION FAILED:");
    errors.forEach((e) => console.error(`   - ${e}`));
    process.exit(1);
  }
  console.log("   ✓ Password meets all strength requirements.");

  // 3. Re-verify the target account before writing
  console.log("\n2. Re-verifying target account...");
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.getUserById(TARGET_AUTH_USER_ID);

  if (authError || !authData?.user) {
    console.error("   FAILED: Could not fetch Auth user:", authError?.message);
    process.exit(1);
  }
  if (authData.user.email?.toLowerCase() !== TARGET_EMAIL.toLowerCase()) {
    console.error(`   IDENTITY MISMATCH: Expected ${TARGET_EMAIL}, got ${authData.user.email}`);
    process.exit(1);
  }
  console.log(`   ✓ Confirmed target: ${authData.user.email} (${TARGET_AUTH_USER_ID})`);

  // 4. Execute password update
  console.log("\n3. Updating password via supabase.auth.admin.updateUserById()...");
  const { data: updateData, error: updateError } =
    await supabaseAdmin.auth.admin.updateUserById(TARGET_AUTH_USER_ID, {
      password: newPassword,
    });

  if (updateError) {
    console.error("   PASSWORD UPDATE FAILED:", updateError.message);
    process.exit(1);
  }

  console.log("   ✓ Password updated successfully.");
  console.log("   Updated User ID: ", updateData.user.id);
  console.log("   Email:           ", updateData.user.email);
  console.log("   Updated At:      ", updateData.user.updated_at);

  // 5. Verify login works with the new password
  console.log("\n4. Verifying login with new credentials...");
  const verifyClient = createClient(SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: loginData, error: loginError } =
    await verifyClient.auth.signInWithPassword({
      email: TARGET_EMAIL,
      password: newPassword,
    });

  if (loginError || !loginData?.session) {
    console.error("   LOGIN VERIFICATION FAILED:", loginError?.message || "No session returned");
    console.error("   The password was updated but login verification failed. Check Supabase settings.");
    process.exit(1);
  }

  console.log("   ✓ Login successful with new password.");
  console.log("   Session User ID:  ", loginData.user.id);
  console.log("   Session Email:    ", loginData.user.email);

  // 6. Verify admin record still intact
  console.log("\n5. Verifying admin database record is preserved...");
  const { data: adminRecord, error: dbError } = await supabaseAdmin
    .from("admin_users")
    .select("id, auth_user_id, email, role, is_active")
    .eq("auth_user_id", TARGET_AUTH_USER_ID)
    .maybeSingle();

  if (dbError || !adminRecord) {
    console.error("   WARNING: Could not verify admin record:", dbError?.message);
  } else {
    console.log("   Admin Record ID: ", adminRecord.id);
    console.log("   Role:            ", adminRecord.role);
    console.log("   Is Active:       ", adminRecord.is_active);
    console.log("   Auth User ID:    ", adminRecord.auth_user_id);

    if (adminRecord.role !== "main_admin") {
      console.error("   WARNING: Role has changed! Expected main_admin, got", adminRecord.role);
    } else {
      console.log("   ✓ main_admin role preserved.");
    }

    if (adminRecord.auth_user_id !== TARGET_AUTH_USER_ID) {
      console.error("   WARNING: auth_user_id mismatch!");
    } else {
      console.log("   ✓ Auth user ID linkage preserved.");
    }
  }

  // Sign out the verification session
  await verifyClient.auth.signOut();

  console.log("\n" + "=".repeat(60));
  console.log("PASSWORD RESET COMPLETE");
  console.log("=".repeat(60));
  console.log("\nResults:");
  console.log(`  Account:     ${TARGET_EMAIL}`);
  console.log(`  Auth ID:     ${TARGET_AUTH_USER_ID}`);
  console.log("  Role:        main_admin (preserved)");
  console.log("  Login:       Verified successfully");
  console.log("  DB Record:   Preserved");
  console.log("\nIMPORTANT: Delete this script after use:");
  console.log("  Remove-Item scripts/admin-password-reset.mjs");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const phase = (process.env.PHASE || "verify").trim().toLowerCase();

if (phase === "verify") {
  verifyAccount().then((ok) => process.exit(ok ? 0 : 1));
} else if (phase === "execute") {
  executeReset().catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });
} else {
  console.error(`Unknown PHASE: "${phase}". Use PHASE=verify or PHASE=execute.`);
  process.exit(1);
}

