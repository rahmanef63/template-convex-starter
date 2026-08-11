// Server error log, in a machine-readable shape.
//
// Next already logs every server error itself (next-server.js →
// `instrumentationOnRequestError` calls this hook, then `logError`), and
// `digest` is an own enumerable property, so Node prints it — the reference code
// app/error.tsx shows the user is greppable without this file. What this adds is
// ONE JSON line per error carrying the file-system route (`context.routePath`)
// and the path with its query string stripped, which a log drain can parse and
// group. That is the whole gain; it costs a second line per error. Delete the
// file if you'd rather grep Next's own output. No SDK either way.
//
// Signature is Next's own type (node_modules/next/dist/server/instrumentation/
// types.d.ts → `InstrumentationOnRequestError`), stable since Next 15:
//   (error: unknown,
//    request: Readonly<{ path: string; method: string; headers: ... }>,
//    context: Readonly<{ routerKind; routePath; routeType; renderSource?;
//                        revalidateReason }>) => void | Promise<void>
// `error` is `unknown` on purpose: React may replace the thrown value while
// rendering Server Components, so narrow before reading `.message` / `.digest`.
//
// PRIVACY: `request.headers` is never read — it carries cookies and auth
// tokens. Neither is any request body (Next doesn't hand one over). The query
// string is dropped from `path` too, since it can hold one-time tokens;
// `context.routePath` is the file-system route, which is what you search on.
import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String((error as { digest: unknown }).digest)
      : undefined;

  console.error(
    JSON.stringify({
      tag: "request-error",
      digest,
      message: error instanceof Error ? error.message : String(error),
      method: request.method,
      path: request.path.split("?")[0],
      route: context.routePath,
      type: context.routeType,
    }),
  );
};
