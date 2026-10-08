import "server-only";
import { betterAuth } from "better-auth";
import { PostgresDialect } from "kysely";
import { Pool } from "pg";
import { headers } from "next/headers";
import { AdminAccessError, assertAdminIdentity, createBetterAuthOptions } from "./auth-policy";

function requiredEnvironment(name: string, minLength = 1): string {
  const value = process.env[name];
  if (!value || value.length < minLength) throw new Error(`${name} is not configured correctly.`);
  return value;
}

const baseURL = requiredEnvironment("BETTER_AUTH_URL");
const parsedBaseURL = new URL(baseURL);
const localOrigin = parsedBaseURL.hostname === "localhost" || parsedBaseURL.hostname === "127.0.0.1";
if (parsedBaseURL.protocol !== "https:" && !(localOrigin && parsedBaseURL.protocol === "http:")) {
  throw new Error("BETTER_AUTH_URL must use HTTPS outside local development.");
}
if (parsedBaseURL.username || parsedBaseURL.password || parsedBaseURL.pathname !== "/" || parsedBaseURL.search || parsedBaseURL.hash) {
  throw new Error("BETTER_AUTH_URL must be an origin without credentials or a path.");
}

const secret = requiredEnvironment("BETTER_AUTH_SECRET", 32);
const connectionString = requiredEnvironment("DATABASE_URL");
const pool = new Pool({ connectionString, max: 4, idleTimeoutMillis: 30_000 });

export const authDatabase = pool;
export const auth = betterAuth({
  ...createBetterAuthOptions(parsedBaseURL.origin, process.env.NODE_ENV === "production"),
  secret,
  database: {
    dialect: new PostgresDialect({ pool }),
    type: "postgres",
    schemaName: "app_auth",
  },
});

export { AdminAccessError };

export async function requireAdmin(): Promise<{ userId: string }> {
  let requestHeaders: Headers;
  try {
    requestHeaders = await headers();
  } catch {
    throw new AdminAccessError("unauthenticated");
  }

  let session;
  try {
    session = await auth.api.getSession({ headers: requestHeaders });
  } catch {
    throw new AdminAccessError("unavailable");
  }

  return { userId: assertAdminIdentity(session?.user.id ?? null, process.env.ADMIN_USER_ID) };
}
