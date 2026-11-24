// Supabase client utilities – shared between browser and server
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Browser (public) client – uses anon key; safe to expose to the client.
// ---------------------------------------------------------------------------
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  {
    // optional: you can enable realtime, auth persistence etc.
    auth: {
      // persist session in localStorage (default for Next.js)
      persistSession: true,
    },
  }
);

// ---------------------------------------------------------------------------
// Server‑side client – uses service role key, never exposed to the browser.
// This client should only be imported from server‑only modules (API routes, server actions).
// ---------------------------------------------------------------------------
export const supabaseServer: SupabaseClient =
  typeof window === "undefined"
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
        {
          // Server‑side defaults – no auth persistence, never cache CMS reads in Next.js Data Cache.
          auth: {
            persistSession: false,
          },
          global: {
            fetch: (url, options = {}) =>
              fetch(url, { ...options, cache: "no-store" }),
          },
        }
      )
    : (new Proxy({} as SupabaseClient, {
        get(_target, prop) {
          throw new Error(
            `[Supabase] Attempted to access supabaseServer.${String(prop)} in the browser. Server-role operations must only run on the server.`
          );
        },
      }));

// Helper to guarantee required env vars at runtime (useful for dev warnings)
if (typeof window === "undefined") {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("[Supabase] NEXT_PUBLIC_SUPABASE_URL is not set.");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.");
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[Supabase] SUPABASE_SERVICE_ROLE_KEY is not set – server‑side DB operations will fail.");
  }
}


