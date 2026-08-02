// Next 16 proxy (renamed from middleware.ts).
//
// Deliberately a pass-through: this starter's auth tokens live in localStorage
// (client-only ConvexAuthProvider — see components/convex-provider.tsx), so the
// proxy cannot see them and a server-side redirect gate is impossible here.
// That's fine security-wise: pages are static shells with no private data —
// everything sensitive flows through Convex functions that check auth, and
// /api/chat verifies the caller's token itself. Private routes render a
// sign-in prompt client-side via <Unauthenticated>.
//
// If you migrate to cookie-based auth (ConvexAuthNextjsProvider), gate here
// with convexAuth.isAuthenticated() and redirect to /login.
import { NextResponse } from "next/server";

export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
