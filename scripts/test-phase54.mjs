import fs from "fs";
import { createClient } from "@supabase/supabase-js";

// Read .env.local manually if not in process.env
if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

const BASE_URL = "http://localhost:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

async function runTests() {
  console.log("=== PHASE 5.4 AUTOMATED INTEGRATION & SECURITY SUITE ===");
  let failures = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      failures++;
    } else {
      console.log(`✅ PASS: ${message}`);
    }
  }

  try {
    // 1. Admin Login
    console.log("\n--- TEST 1: Main Admin Authentication ---");
    const adminEmail = process.env.MAIN_ADMIN_EMAIL || "admin@kingspavilion.org";
    const adminPassword = process.env.MAIN_ADMIN_INITIAL_PASSWORD || "KingsPavilion2026#Admin!";

    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, `Admin login HTTP status 200 (got ${adminLoginRes.status})`);
    assert(adminLoginData.user?.role === "main_admin", `Admin user role is main_admin`);
    const adminToken = adminLoginData.token;
    assert(!!adminToken, "Admin access token retrieved");

    // 2. Admin Session Inspection
    console.log("\n--- TEST 2: Main Admin Session Verification ---");
    const adminMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminMeData = await adminMeRes.json();
    assert(adminMeRes.status === 200, `GET /api/auth/me HTTP status 200 (got ${adminMeRes.status})`);
    assert(adminMeData.user?.email === adminEmail, `Session email matches ${adminEmail}`);

    // 3. Admin Lists Operators
    console.log("\n--- TEST 3: Admin Lists Operator Accounts ---");
    const listOpsRes = await fetch(`${BASE_URL}/api/admin/operators`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listOpsData = await listOpsRes.json();
    assert(listOpsRes.status === 200, `GET /api/admin/operators HTTP status 200 (got ${listOpsRes.status})`);
    assert(Array.isArray(listOpsData.operators), "Operators list is an array");

    // 4. Admin Provisions a New Check-In Operator
    console.log("\n--- TEST 4: Admin Provisions Operator Account ---");
    const testOpEmail = `test.operator.${Date.now()}@kingspavilion.org`;
    const testOpPassword = "SecureOperatorPassword2026!";
    const testOpName = "Sister Deborah (Test Operator)";

    const createOpRes = await fetch(`${BASE_URL}/api/admin/operators`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        email: testOpEmail,
        fullName: testOpName,
        password: testOpPassword,
      }),
    });
    const createOpData = await createOpRes.json();
    assert(createOpRes.status === 201, `POST /api/admin/operators HTTP status 201 (got ${createOpRes.status})`);
    assert(createOpData.operator?.email === testOpEmail, "Operator created with correct email");
    assert(createOpData.operator?.role === "checkin_operator", "Operator assigned checkin_operator role");
    const testOpId = createOpData.operator?.id;

    // 5. Operator Login
    console.log("\n--- TEST 5: Operator Login & Redirection Flow ---");
    const opLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testOpEmail,
        password: testOpPassword,
      }),
    });
    const opLoginData = await opLoginRes.json();
    assert(opLoginRes.status === 200, `Operator login HTTP status 200 (got ${opLoginRes.status})`);
    assert(opLoginData.user?.role === "checkin_operator", "Operator role is checkin_operator");
    assert(opLoginData.redirectUrl === "/checkin", "Operator redirected to /checkin");
    const opToken = opLoginData.token;
    assert(!!opToken, "Operator access token retrieved");

    // 6. RBAC Enforcement: Operator cannot access Admin API
    console.log("\n--- TEST 6: RBAC: Operator Blocked from Admin Routes ---");
    const opForbiddenRes = await fetch(`${BASE_URL}/api/admin/operators`, {
      headers: { Authorization: `Bearer ${opToken}` },
    });
    assert(opForbiddenRes.status === 403, `Operator accessing /api/admin/operators returns 403 Forbidden (got ${opForbiddenRes.status})`);

    // 7. Check-In Stats: Accessible by Operator
    console.log("\n--- TEST 7: Check-In Stats Access ---");
    const statsRes = await fetch(`${BASE_URL}/api/checkin/stats`, {
      headers: { Authorization: `Bearer ${opToken}` },
    });
    const statsData = await statsRes.json();
    assert(statsRes.status === 200, `Operator accessing /api/checkin/stats returns 200 (got ${statsRes.status})`);
    assert(typeof statsData.totalRegistered === "number", "statsData.totalRegistered is a number");

    // 8. Create Synthetic Attendee for Check-In Verification
    console.log("\n--- TEST 8: Synthetic Attendee Creation & Data Sanitization ---");
    const testRef = `KP-TEST-${Date.now().toString().slice(-6)}`;
    const syntheticAttendee = {
      full_name: "Test Attendee Sister Joy",
      email: "sister.joy.test@example.com",
      phone: "+2348011223344",
      normalized_email: "sister.joy.test@example.com",
      normalized_phone: "+2348011223344",
      residential_address: "123 Grace Street, Ikeja, Lagos",
      attendance_category: "Physical",
      first_time: true,
      reference: testRef,
      prayer_point: "TOP_SECRET_PRAYER_POINT_SHOULD_NEVER_BE_EXPOSED",
      expectation: "TOP_SECRET_EXPECTATIONS_SHOULD_NEVER_BE_EXPOSED",
      created_at: new Date().toISOString(),
    };

    const { data: createdAttendee, error: attError } = await supabaseAdmin
      .from("attendees")
      .insert([syntheticAttendee])
      .select("id, reference, full_name, email, phone")
      .single();

    if (attError) console.error("Attendee insert error:", attError);
    assert(!attError && !!createdAttendee, "Synthetic attendee created in database");

    // 9. Operator Lookup by Reference (Sanitization Check)
    console.log("\n--- TEST 9: Attendee Lookup & Privacy Shield ---");
    const searchRes = await fetch(`${BASE_URL}/api/checkin/search?q=${testRef}`, {
      headers: { Authorization: `Bearer ${opToken}` },
    });
    const searchData = await searchRes.json();
    assert(searchRes.status === 200, `GET /api/checkin/search HTTP status 200 (got ${searchRes.status})`);
    assert(searchData.results?.length === 1, "Found exactly 1 matching attendee");

    const foundAttendee = searchData.results?.[0];
    assert(foundAttendee?.reference === testRef, "Reference matches");
    assert(foundAttendee?.prayer_point === undefined, "CONFIDENTIAL CHECK: prayer_point is stripped from response");
    assert(foundAttendee?.expectation === undefined, "CONFIDENTIAL CHECK: expectation is stripped from response");
    assert(foundAttendee?.residential_address === undefined, "CONFIDENTIAL CHECK: residential_address is stripped from response");

    // 10. Check-In Confirmation (Atomic Check-in)
    console.log("\n--- TEST 10: Atomic Attendee Check-In Confirmation ---");
    const confirmRes = await fetch(`${BASE_URL}/api/checkin/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({
        attendeeId: createdAttendee.id,
      }),
    });
    const confirmData = await confirmRes.json();
    assert(confirmRes.status === 200, `POST /api/checkin/confirm HTTP status 200 (got ${confirmRes.status})`);
    assert(confirmData.success === true, "Confirmation success is true");
    assert(!!confirmData.attendee?.checkedInAt, "Confirmation returned checkedInAt timestamp");
    assert(confirmData.attendee?.operatorEmail === testOpEmail, "Check-in correctly attributed to operator");

    // 11. Duplicate Check-In Prevention (409 Conflict)
    console.log("\n--- TEST 11: Duplicate Check-In Prevention (Race Protection) ---");
    const dupRes = await fetch(`${BASE_URL}/api/checkin/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({
        attendeeId: createdAttendee.id,
      }),
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409, `Duplicate check-in returns 409 Conflict (got ${dupRes.status})`);
    assert(dupData.alreadyCheckedIn === true, "Duplicate response flags alreadyCheckedIn: true");

    // 12. Operator Deactivation & Immediate Session Revocation
    console.log("\n--- TEST 12: Account Deactivation & Session Revocation ---");
    const deactivateRes = await fetch(`${BASE_URL}/api/admin/operators`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        id: testOpId,
        isActive: false,
      }),
    });
    assert(deactivateRes.status === 200, `Admin deactivated operator HTTP status 200 (got ${deactivateRes.status})`);

    // Now attempt to use the existing operator token
    const revokedRes = await fetch(`${BASE_URL}/api/checkin/stats`, {
      headers: { Authorization: `Bearer ${opToken}` },
    });
    assert(revokedRes.status === 401 || revokedRes.status === 403, `Deactivated operator immediately rejected with 401/403 (got ${revokedRes.status})`);

    // 13. Teardown / Database Cleanup
    console.log("\n--- TEST 13: Database Cleanup & Zero Test Leakage ---");
    if (createdAttendee?.id) {
      await supabaseAdmin.from("qr_checkins").delete().eq("attendee_id", createdAttendee.id);
      await supabaseAdmin.from("attendees").delete().eq("id", createdAttendee.id);
    }
    if (testOpId) {
      await supabaseAdmin.from("admin_users").delete().eq("id", testOpId);
      if (createOpData.operator?.auth_user_id) {
        await supabaseAdmin.auth.admin.deleteUser(createOpData.operator.auth_user_id);
      }
    }

    // Verify 0 synthetic attendees remain
    const { count: remainingAttendees } = await supabaseAdmin
      .from("attendees")
      .select("*", { count: "exact", head: true });
    assert(remainingAttendees === 0, `Database attendees count is exactly 0 (got ${remainingAttendees})`);

    // Verify 0 test operators remain in Supabase Auth
    const { data: finalAuthList } = await supabaseAdmin.auth.admin.listUsers();
    const remainingTestOps = (finalAuthList?.users || []).filter(u => u.email.startsWith("test.operator."));
    assert(remainingTestOps.length === 0, `Supabase Auth test operators count is exactly 0 (got ${remainingTestOps.length})`);

    console.log(`\n======================================================`);
    console.log(`RESULTS: ${failures === 0 ? "ALL TESTS PASSED! 🎉" : `${failures} FAILURES DETECTED`}`);
    console.log(`======================================================\n`);

    if (failures > 0) process.exit(1);
  } catch (err) {
    console.error("Test execution threw exception:", err);
    process.exit(1);
  }
}

runTests();
