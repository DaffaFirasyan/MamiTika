export type AdminAccessReason = "unauthenticated" | "forbidden" | "unavailable";

export class AdminAccessError extends Error {
  readonly reason: AdminAccessReason;

  constructor(reason: AdminAccessReason) {
    super(
      reason === "unauthenticated"
        ? "Sesi pemilik diperlukan."
        : reason === "forbidden"
          ? "Akun ini tidak memiliki akses pemilik."
          : "Akses pemilik belum dapat diverifikasi.",
    );
    this.reason = reason;
    this.name = "AdminAccessError";
  }
}

export function assertAdminIdentity(sessionUserId: string | null, adminUserId: string | undefined): string {
  if (!sessionUserId) throw new AdminAccessError("unauthenticated");
  if (!adminUserId) throw new AdminAccessError("unavailable");
  if (sessionUserId !== adminUserId) throw new AdminAccessError("forbidden");
  return sessionUserId;
}

export function createBetterAuthOptions(baseURL: string, secureCookies: boolean) {
  const origin = new URL(baseURL).origin;
  return {
    appName: "Mamitika",
    baseURL: origin,
    trustedOrigins: [origin],
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      revokeSessionsOnPasswordReset: true,
    },
    session: {
      expiresIn: 12 * 60 * 60,
      updateAge: 60 * 60,
      storeSessionInDatabase: true,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: "database" as const,
      window: 60,
      max: 100,
      customRules: { "/sign-in/email": { window: 60, max: 5 } },
    },
    advanced: {
      defaultCookieAttributes: {
        httpOnly: true,
        secure: secureCookies,
        sameSite: "lax" as const,
        path: "/",
      },
    },
  };
}
