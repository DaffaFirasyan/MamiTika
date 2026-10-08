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
      if (key === "\u0003") { cleanup(); reject(new Error("Cancelled.")); }
      else if (key === "\r" || key === "\n") { cleanup(); stdout.write("\n"); resolve(value); }
      else if (key === "\u007f" || key === "\b") value = value.slice(0, -1);
      else if (key >= " ") value += key;
    };
    function cleanup() { stdin.off("data", onData); stdin.setRawMode(false); stdin.pause(); }
    stdin.on("data", onData);
  });
}

const ownerId = required("ADMIN_USER_ID");
const password = await secret("Password baru (minimal 12 karakter): ");
const confirmation = await secret("Ulangi password baru: ");
if (password.length < 12 || password.length > 128) throw new Error("Password must contain 12–128 characters.");
if (password !== confirmation) throw new Error("Passwords do not match.");

const pool = new Pool({ connectionString: required("DATABASE_URL"), max: 1 });
try {
  await pool.query("begin");
  const owner = await pool.query('select id from app_auth."user" where id = $1 for update', [ownerId]);
  if (owner.rowCount !== 1) throw new Error("ADMIN_USER_ID does not identify an account in app_auth.");
  const account = await pool.query(
    'update app_auth.account set password = $2, "updatedAt" = now() where "userId" = $1 and "providerId" = \'credential\' and "accountId" = $1',
    [ownerId, await hashPassword(password)],
  );
  if (account.rowCount !== 1) throw new Error("Expected exactly one local credential account.");
  await pool.query('delete from app_auth."session" where "userId" = $1', [ownerId]);
  await pool.query("commit");
  stdout.write("Owner password reset. All owner sessions were revoked.\n");
} catch (error) {
  await pool.query("rollback").catch(() => {});
  throw error;
} finally {
  await pool.end();
}
