// Next 16 proxy (renamed from middleware.ts).
// Stub — extend with auth gate via convexAuthNextjsToken() when ready; the
// request arrives as the first argument (type NextRequest) when you need it.
import { NextResponse } from "next/server";

export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
