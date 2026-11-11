import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMainAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseClient";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const CreateOperatorSchema = z.object({
  email: z.string().email("A valid email address is required."),
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  password: z.string().min(8, "Temporary password must be at least 8 characters."),
});

const UpdateOperatorSchema = z.object({
  id: z.string().uuid("Invalid operator ID."),
  isActive: z.boolean().optional(),
  fullName: z.string().min(2).optional(),
});

// ---------------------------------------------------------------------------
// GET /api/admin/operators — List all operator accounts
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const authCheck = await requireMainAdmin(request);
  if ("errorResponse" in authCheck) {
    return authCheck.errorResponse;
  }

  let queryRes: any = await supabaseServer
    .from("admin_users")
    .select("id, auth_user_id, email, full_name, role, is_active, last_sign_in_at, created_at")
    .order("created_at", { ascending: false });

  if (queryRes.error) {
    queryRes = await supabaseServer
      .from("admin_users")
      .select("id, auth_user_id, email, role, created_at")
      .order("created_at", { ascending: false });
  }

  if (queryRes.error) {
    console.error("[Operators] Query error:", queryRes.error.message);
    return NextResponse.json({ error: "Failed to fetch accounts." }, { status: 500 });
  }

  const operators = await Promise.all(
    (queryRes.data || []).map(async (o: any) => {
      let isActive = o.is_active ?? true;
      let fullName = o.full_name;
      if (o.auth_user_id && (o.is_active === undefined || !fullName)) {
        try {
          const { data: u } = await supabaseServer.auth.admin.getUserById(o.auth_user_id);
          if (u?.user) {
            if (o.is_active === undefined) {
              isActive = u.user.user_metadata?.is_active !== false && !u.user.banned_until;
            }
            if (!fullName) {
              fullName = u.user.user_metadata?.full_name;
            }
          }
        } catch {}
      }
      return {
        id: o.id,
        email: o.email,
        full_name: fullName || o.email.split("@")[0],
        role: o.role,
        is_active: isActive,
        last_sign_in_at: o.last_sign_in_at || null,
        created_at: o.created_at,
      };
    })
  );

  return NextResponse.json({ operators });
}

// ---------------------------------------------------------------------------
// POST /api/admin/operators — Create a new Check-in Operator account
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const authCheck = await requireMainAdmin(request);
  if ("errorResponse" in authCheck) {
    return authCheck.errorResponse;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const parsed = CreateOperatorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, fullName, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email already exists in admin_users
  const { data: existingAdmin } = await supabaseServer
    .from("admin_users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingAdmin) {
    return NextResponse.json(
      { error: "An account with this email address already exists." },
      { status: 409 }
    );
  }

  // 1. Create auth user in Supabase Auth via admin API
  const { data: authUser, error: authCreateError } =
    await supabaseServer.auth.admin.createUser({
      email: normalizedEmail,
      password: password,
      email_confirm: true, // auto-confirm for administrative provisioning
      user_metadata: { full_name: fullName.trim() },
    });

  if (authCreateError || !authUser.user) {
    console.error("[Operators] Auth creation error:", authCreateError?.message);
    return NextResponse.json(
      { error: authCreateError?.message || "Failed to create authentication user." },
      { status: 500 }
    );
  }

  // 2. Insert into public.admin_users
  let insertRes: any = await supabaseServer
    .from("admin_users")
    .insert({
      auth_user_id: authUser.user.id,
      email: normalizedEmail,
      full_name: fullName.trim(),
      role: "checkin_operator",
      is_active: true,
    })
    .select("id, auth_user_id, email, full_name, role, is_active, created_at")
    .single();

  if (insertRes.error) {
    // Fallback if full_name/is_active not yet migrated
    insertRes = await supabaseServer
      .from("admin_users")
      .insert({
        auth_user_id: authUser.user.id,
        email: normalizedEmail,
        role: "checkin_operator",
      })
      .select("id, auth_user_id, email, role, created_at")
      .single();
  }

  const insertError = insertRes.error;
  const createdRecord = insertRes.data;

  if (insertError) {
    console.error("[Operators] DB insert error:", insertError.message);
    // Rollback auth user
    await supabaseServer.auth.admin.deleteUser(authUser.user.id);
    return NextResponse.json({ error: "Failed to create operator record." }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, operator: createdRecord },
    { status: 201 }
  );
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/operators — Activate / Deactivate / Update Operator
// ---------------------------------------------------------------------------
export async function PATCH(request: NextRequest) {
  const authCheck = await requireMainAdmin(request);
  if ("errorResponse" in authCheck) {
    return authCheck.errorResponse;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const parsed = UpdateOperatorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { id, isActive, fullName } = parsed.data;

  // 1. Fetch existing operator record to obtain auth_user_id
  const { data: existingOp, error: fetchErr } = await supabaseServer
    .from("admin_users")
    .select("id, auth_user_id, email, role")
    .eq("id", id)
    .single();

  if (fetchErr || !existingOp) {
    return NextResponse.json({ error: "Operator not found." }, { status: 404 });
  }

  // Prevent main_admin from deactivating themselves
  if (id === authCheck.admin.adminId && isActive === false) {
    return NextResponse.json(
      { error: "Cannot deactivate your own main administrator account." },
      { status: 400 }
    );
  }

  // 2. Synchronize deactivation/activation with Supabase Auth
  if (existingOp.auth_user_id) {
    const authUpdates: any = { user_metadata: {} };
    if (typeof isActive === "boolean") {
      authUpdates.user_metadata.is_active = isActive;
      authUpdates.ban_duration = isActive ? "none" : "876000h"; // Revoke immediately
    }
    if (fullName) {
      authUpdates.user_metadata.full_name = fullName.trim();
    }
    try {
      await supabaseServer.auth.admin.updateUserById(existingOp.auth_user_id, authUpdates);
    } catch (authErr) {
      console.warn("[Operators] Supabase Auth update warning:", authErr);
    }
  }

  // 3. Update public.admin_users table (fallback gracefully if is_active column pending SQL Editor run)
  const updates: Record<string, unknown> = {};
  if (typeof isActive === "boolean") updates.is_active = isActive;
  if (fullName) updates.full_name = fullName.trim();

  let updatedRecord: any = null;
  if (Object.keys(updates).length > 0) {
    try {
      const { data: updated, error } = await supabaseServer
        .from("admin_users")
        .update(updates)
        .eq("id", id)
        .select("id, email, full_name, role, is_active, last_sign_in_at")
        .maybeSingle();

      if (!error && updated) {
        updatedRecord = updated;
      }
    } catch (dbErr) {
      console.warn("[Operators] DB update column warning:", dbErr);
    }
  }

  return NextResponse.json({
    success: true,
    operator: {
      id: existingOp.id,
      email: existingOp.email,
      full_name: fullName || existingOp.email.split("@")[0],
      role: existingOp.role,
      is_active: isActive !== undefined ? isActive : true,
    },
  });
}

