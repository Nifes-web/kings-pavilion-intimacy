import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabaseClient";

const LoginSchema = z.object({
  email: z.string().email("A valid email address is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed.", fields: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // 1. Authenticate credentials with an ephemeral auth client (keeps supabaseServer unmutated)
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: authData, error: authError } =
      await authClient.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (authError || !authData.session || !authData.user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const user = authData.user;
    const session = authData.session;

    // 2. Verify account exists in public.admin_users
    let adminRecord: any = null;
    let queryRes = await supabaseServer
      .from("admin_users")
      .select("id, auth_user_id, email, full_name, role, is_active")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (queryRes.error) {
      queryRes = await supabaseServer
        .from("admin_users")
        .select("id, auth_user_id, email, role")
        .eq("auth_user_id", user.id)
        .maybeSingle();
    }

    if (queryRes.error || !queryRes.data) {
      return NextResponse.json(
        { error: "Account not authorized for administrative or check-in access." },
        { status: 403 }
      );
    }
    adminRecord = queryRes.data;

    // 3. Strict deactivation check
    if (adminRecord.is_active === false) {
      return NextResponse.json(
        { error: "This account has been deactivated. Please contact the administrator." },
        { status: 403 }
      );
    }

    // 4. Update last_sign_in_at timestamp (safely ignored if column not yet added)
    try {
      await supabaseServer
        .from("admin_users")
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq("id", adminRecord.id);
    } catch {
      // non-critical
    }

    // 5. Build response and set secure HttpOnly cookie
    const redirectUrl = adminRecord.role === "main_admin" ? "/admin" : "/checkin";

    const response = NextResponse.json({
      success: true,
      user: {
        adminId: adminRecord.id,
        email: adminRecord.email,
        fullName: adminRecord.full_name || adminRecord.email.split("@")[0],
        role: adminRecord.role,
      },
      token: session.access_token,
      redirectUrl,
    });

    response.cookies.set("kp_auth_token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: session.expires_in || 60 * 60 * 24 * 7, // 7 days default
    });

    return response;
  } catch (err) {
    console.error("[Login] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during authentication." },
      { status: 500 }
    );
  }
}

