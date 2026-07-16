import { ConvexError } from "convex/values";

// User-facing message from a caught error: Convex functions throw
// ConvexError("...") for expected failures; anything else gets the fallback.
export function errorMessage(err: unknown, fallback = "Something went wrong.") {
  return err instanceof ConvexError && typeof err.data === "string"
    ? err.data
    : fallback;
}
