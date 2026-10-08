import assert from "node:assert/strict";
import { test } from "node:test";
import { assertAdminIdentity, createBetterAuthOptions, AdminAccessError } from "../src/lib/auth-policy.ts";

test("Better Auth policy enables password login and disables public signup/providers/reset", () => {
  const options = createBetterAuthOptions("https://mamitika.example", true);
  assert.deepEqual(options.trustedOrigins, ["https://mamitika.example"]);
  assert.deepEqual(options.emailAndPassword, {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
  });
  assert.equal("socialProviders" in options, false);
  assert.equal("password" in options.emailAndPassword, false);
  assert.equal(options.rateLimit.storage, "database");
  assert.equal(options.rateLimit.enabled, true);
  assert.equal(options.session.storeSessionInDatabase, true);
  assert.deepEqual(options.advanced.defaultCookieAttributes, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
});

test("Better Auth cookies stay usable on local HTTP and keep origin exact", () => {
  const options = createBetterAuthOptions("http://localhost:3000", false);
  assert.deepEqual(options.trustedOrigins, ["http://localhost:3000"]);
  assert.equal(options.advanced.defaultCookieAttributes.secure, false);
});

test("admin guard requires an authenticated user matching the configured owner ID", () => {
  assert.throws(() => assertAdminIdentity(null, "owner-id"), (error) => error instanceof AdminAccessError && error.reason === "unauthenticated");
  assert.throws(() => assertAdminIdentity("user-id", undefined), (error) => error instanceof AdminAccessError && error.reason === "unavailable");
  assert.throws(() => assertAdminIdentity("user-id", "owner-id"), (error) => error instanceof AdminAccessError && error.reason === "forbidden");
  assert.equal(assertAdminIdentity("owner-id", "owner-id"), "owner-id");
});

const integrationConfigured = Boolean(
  process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_URL &&
  process.env.ADMIN_USER_ID && process.env.AUTH_TEST_EMAIL && process.env.AUTH_TEST_PASSWORD,
);

test("Better Auth login, signup rejection, session expiry and owner session integration", {
  skip: integrationConfigured ? false : "local development database and AUTH_TEST_* owner credentials are not configured",
}, async () => {
  const { auth, authDatabase } = await import("../src/lib/auth.ts");
  const baseUrl = process.env.BETTER_AUTH_URL!;
  const email = process.env.AUTH_TEST_EMAIL!;
  const password = process.env.AUTH_TEST_PASSWORD!;
  const ownerId = process.env.ADMIN_USER_ID!;
  const post = (path: string, body: unknown, cookie?: string) => auth.handler(new Request(`${baseUrl}/api/auth/${path}`, {
    method: "POST",
    headers: {
      origin: baseUrl,
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
  }));

  const failedLogin = await post("sign-in/email", { email, password: `${password}wrong` });
  assert.equal(failedLogin.ok, false);

  const signup = await post("sign-up/email", { name: "Test", email: `blocked-${Date.now()}@example.invalid`, password });
  assert.equal(signup.ok, false);

  const login = await post("sign-in/email", { email, password });
  assert.equal(login.ok, true);
  const cookie = login.headers.getSetCookie().map((value) => value.split(";", 1)[0]).join("; ");
  assert.ok(cookie);
  const sessionResponse = await auth.handler(new Request(`${baseUrl}/api/auth/get-session`, { headers: { cookie } }));
  const session = await sessionResponse.json() as { user?: { id?: string }; session?: { id?: string } } | null;
  assert.equal(session?.user?.id, ownerId);
  assert.equal(assertAdminIdentity(session?.user?.id ?? null, ownerId), ownerId);

  await authDatabase.query('UPDATE app_auth."session" SET "expiresAt" = now() - interval \'1 minute\' WHERE "id" = $1', [session?.session?.id]);
  const expiredResponse = await auth.handler(new Request(`${baseUrl}/api/auth/get-session`, { headers: { cookie } }));
  assert.equal(await expiredResponse.json(), null);
  await authDatabase.end();
});
