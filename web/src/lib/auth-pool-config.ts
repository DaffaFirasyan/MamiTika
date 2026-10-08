const sslParameters = new Set(["sslmode", "sslrootcert", "sslcert", "sslkey"]);

export function createAuthPoolConfig(connectionString: string, caCertificate?: string) {
  if (!caCertificate) return { connectionString };
  if (!caCertificate.includes("-----BEGIN CERTIFICATE-----") || !caCertificate.includes("-----END CERTIFICATE-----")) {
    throw new Error("DATABASE_SSL_CA must contain a PEM certificate.");
  }

  const url = new URL(connectionString);
  for (const key of Array.from(url.searchParams.keys())) {
    if (sslParameters.has(key.toLowerCase())) url.searchParams.delete(key);
  }

  return {
    connectionString: url.toString(),
    ssl: { ca: caCertificate, rejectUnauthorized: true },
  };
}
