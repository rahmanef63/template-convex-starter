// Password reset is optional, and "not configured" is the DEFAULT state of a
// fresh clone — so it has to be a first-class answer, not an accident halfway
// through the flow. convex/auth.ts asks mailConfigured() *before* it looks any
// address up, which is what keeps that answer identical for every address (and
// so keeps the login form from confirming who has an account).
import { afterEach, expect, test } from "vitest";
import { ConvexError } from "convex/values";
import { mailConfigured, sendEmail } from "../convex/_shared/email";

const saved = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  AUTH_EMAIL_FROM: process.env.AUTH_EMAIL_FROM,
};

function unset() {
  delete process.env.RESEND_API_KEY;
  delete process.env.AUTH_EMAIL_FROM;
}

afterEach(() => {
  unset();
  for (const [k, v] of Object.entries(saved)) if (v !== undefined) process.env[k] = v;
});

test("mail is unconfigured until BOTH vars are set", () => {
  unset();
  expect(mailConfigured()).toBe(false);
  // Half-configured is not configured: a key with no verified from-address just
  // fails later, where the failure would be harder to read.
  process.env.RESEND_API_KEY = "re_test";
  expect(mailConfigured()).toBe(false);
  process.env.AUTH_EMAIL_FROM = "Test <no-reply@example.com>";
  expect(mailConfigured()).toBe(true);
});

test("sendEmail refuses instead of half-sending when unconfigured", async () => {
  unset();
  const err: unknown = await sendEmail({ to: "a@example.com", subject: "s", text: "t" }).then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(ConvexError);
  expect((err as ConvexError<{ code: string }>).data.code).toBe("NOT_CONFIGURED");
});
