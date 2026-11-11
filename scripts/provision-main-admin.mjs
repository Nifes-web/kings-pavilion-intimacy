/**
 * CLI utility to provision the initial Main Administrator account.
 * Run directly via Node.js with the service role key in .env.local.
 *
 * Usage:
 *   node scripts/provision-main-admin.mjs <admin_email> <admin_password> [full_name]
 *
 * Example:
 *   node scripts/provision-main-admin.mjs pastor@kingspavilion.org StrongPassword123# "Pastor Admin"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

const args = process.argv.slice(2);
const email = args[0] || process.env.MAIN_ADMIN_NOTIFICATION_EMAIL;
const password = args[1];
const fullName = args[2] || "Main Administrator";

if (!email || !password) {
  console.error("❌ Usage: node scripts/provision-main-admin.mjs <admin_email> <admin_password> [full_name]");
  process.exit(1);
}

console.log(`\n🔐 Provisioning Main Administrator: ${email}...`);

async function provision() {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check if user already exists in auth.users
  const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("❌ Failed to list auth users:", listError.message);
    process.exit(1);
  }

  let authUser = userList.users.find((u) => u.email?.toLowerCase() === cleanEmail);

  if (!authUser) {
    console.log("  Creating new Auth user...");
    const { data: createdAuth, error: createError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !createdAuth.user) {
      console.error("❌ Failed to create auth user:", createError?.message);
      process.exit(1);
    }
    authUser = createdAuth.user;
    console.log("  ✅ Auth user created successfully.");
  } else {
    console.log("  Auth user exists. Updating password...");
    await supabase.auth.admin.updateUserById(authUser.id, {
      password: password,
      email_confirm: true,
    });
    console.log("  ✅ Auth user credentials updated.");
  }

  // 2. Check public.admin_users (safely checking with fallback if columns not yet migrated)
  const { data: existingAdmin, error: queryError } = await supabase
    .from("admin_users")
    .select("id, role")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (queryError) {
    console.error("❌ Error querying admin_users table:", queryError.message);
    process.exit(1);
  }

  // Build insert/update payload
  const adminPayload = {
    auth_user_id: authUser.id,
    email: cleanEmail,
    role: "main_admin",
  };

  // Try to include enhanced columns if migration has run
  if (!existingAdmin) {
    console.log("  Inserting row into public.admin_users as 'main_admin'...");
    let insertResult = await supabase.from("admin_users").insert({
      ...adminPayload,
      full_name: fullName,
      is_active: true,
    });

    if (insertResult.error) {
      // Fallback to basic columns if migration hasn't been applied yet
      console.log("  Retrying with basic columns...");
      insertResult = await supabase.from("admin_users").insert(adminPayload);
    }

    if (insertResult.error) {
      console.error("❌ Error inserting into admin_users:", insertResult.error.message);
      process.exit(1);
    }
    console.log("  ✅ Row created in admin_users.");
  } else {
    console.log("  Updating existing admin_users record to main_admin...");
    let updateResult = await supabase
      .from("admin_users")
      .update({
        role: "main_admin",
        full_name: fullName,
        is_active: true,
      })
      .eq("id", existingAdmin.id);

    if (updateResult.error) {
      updateResult = await supabase
        .from("admin_users")
        .update({ role: "main_admin" })
        .eq("id", existingAdmin.id);
    }

    if (updateResult.error) {
      console.error("❌ Error updating admin_users:", updateResult.error.message);
      process.exit(1);
    }
    console.log("  ✅ Record updated.");
  }

  console.log(`\n🎉 Success! Main Administrator account provisioned:`);
  console.log(`   Email: ${cleanEmail}`);
  console.log(`   Role:  main_admin`);
  console.log(`   Login URL: http://localhost:3000/login\n`);
}

provision();
