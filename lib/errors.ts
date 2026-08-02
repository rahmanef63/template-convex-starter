import { ConvexError } from "convex/values";

// User-facing message from a caught error. Convex functions throw
// `ConvexError({ code, message })` for expected failures (see convex/notes.ts);
// a bare `ConvexError("string")` is still honored for back-compat. Anything else
// gets the fallback so internal details never reach the UI.
export function errorMessage(err: unknown, fallback = "Something went wrong.") {
  if (!(err instanceof ConvexError)) return fallback;
  const data = err.data as string | { message?: unknown };
  if (typeof data === "string") return data;
  return typeof data?.message === "string" ? data.message : fallback;
}
