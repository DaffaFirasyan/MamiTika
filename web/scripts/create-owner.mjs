import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { stdin, stdout } from "node:process";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required in the local environment.`);
  return value;
}

async function secret(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") throw new Error("Run this script in an interactive local terminal.");
  stdout.write(prompt);
  let value = "";
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve, reject) => {
    const onData = (chunk) => {
      const key = chunk.toString();
      if (key === "\u0003") {
        cleanup();
        reject(new Error("Cancelled."));
      } else if (key === "\r" || key === "\n") {
        cleanup();
        stdout.write("\n");
        resolve(value);
      } else if (key === "\u007f" || key === "\b") {
        value = value.slice(0, -1);
      } else if (key >= " ") value += key;
    };
    function cleanup() {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    }
    stdin.on("data", onData);
  });
}

const email = (process.env.OWNER_EMAIL ?? "").trim().toLowerCase();
const name = (process.env.OWNER_NAME ?? "Pemilik Mamitika").trim();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Set OWNER_EMAIL to the owner's email in the local environment.");
if (!name || name.length > 120) throw new Error("OWNER_NAME must contain 1–120 characters.");
const envPath = new URL("../.env.local", import.meta.url);
const localEnvironment = await readFile(envPath, "utf8");
const adminIdLines = localEnvironment.match(/^ADMIN_USER_ID=.*$/gm) ?? [];
if (adminIdLines.length !== 1 || adminIdLines[0] !== "ADMIN_USER_ID=") {
  throw new Error(".env.local must contain one blank ADMIN_USER_ID before creating the owner.");
}
const password = await secret("Password owner (minimal 12 karakter): ");
const confirmation = await secret("Ulangi password owner: ");
if (password.length < 12 || password.length > 128) throw new Error("Password must contain 12–128 characters.");
if (password !== confirmation) throw new Error("Passwords do not match.");

const pool = new Pool({ connectionString: required("DATABASE_URL"), max: 1 });
try {
  const userId = randomUUID();
  const passwordHash = await hashPassword(password);
  await pool.query("begin");
  await pool.query("select pg_advisory_xact_lock(728315204)");
  const { rows } = await pool.query('select count(*)::int as count from app_auth."user"');
  if (rows[0].count !== 0) throw new Error("An account already exists. Use the local recovery script instead.");
  await pool.query(
    'insert into app_auth."user" (id, name, email, "emailVerified") values ($1, $2, $3, true)',
    [userId, name, email],
  );
  await pool.query(
    'insert into app_auth.account (id, "accountId", "providerId", "userId", password) values ($1, $2, \'credential\', $2, $3)',
    [randomUUID(), userId, passwordHash],
  );
  await pool.query("commit");
  const updatedEnvironment = localEnvironment.replace(/^ADMIN_USER_ID=$/m, `ADMIN_USER_ID=${userId}`);
  await writeFile(envPath, updatedEnvironment, "utf8");
  stdout.write("Owner account created. ADMIN_USER_ID was saved in the local environment file.\n");
} catch (error) {
  await pool.query("rollback").catch(() => {});
  throw error;
} finally {
  await pool.end();
}
