"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * AuthHashListener checks for Supabase auth URL hash fragments on initial page load.
 *
 * When Supabase sends recovery or magic link emails with a default redirect URL of "/",
 * the browser lands on "http://localhost:3000/#access_token=...&type=recovery...".
 * Because URL hash fragments are never transmitted to the server in HTTP requests,
 * this client component detects recovery tokens on the root or other non-auth pages
 * and securely transfers the browser to the dedicated `/reset-password` route.
 *
 * Security:
 * - Tokens are NEVER logged, printed, or sent to analytics.
 * - Hash fragment is passed directly to the dedicated route via client-side routing.
 */
export function AuthHashListener() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    const search = window.location.search;

    // Only process if we aren't already on the reset-password page
    if (pathname === "/reset-password") return;

    const isRecoveryHash = hash && (hash.includes("type=recovery") || hash.includes("access_token="));
    const isRecoveryQuery = search && (search.includes("type=recovery") || search.includes("code="));

    if (isRecoveryHash) {
      // Forward the user directly to /reset-password along with the original hash fragment
      router.replace(`/reset-password${hash}`);
    } else if (isRecoveryQuery && search.includes("code=")) {
      // Forward PKCE query code
      router.replace(`/reset-password${search}`);
    }
  }, [pathname, router]);

  return null;
}

