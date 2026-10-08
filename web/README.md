# Mamitika web

## Local development

1. Create `web/.env.local` from `.env.example` and fill values for a local/development database and Supabase project. Never use production credentials for local checks.
2. Start the local Supabase stack and apply migrations with `npx supabase start` then `npx supabase migration up --local`.
3. Set a password for the restricted PostgreSQL role `mamitika_auth` out of band, then use that role in `DATABASE_URL`. The role should only access `app_auth` tables. For Netlify's hosted runtime, set the root CA PEM downloaded from the same Supabase development project in the site-only, secret `DATABASE_SSL_CA` variable for the `production` context and Build/Functions/Runtime scopes. The app verifies both certificate chain and hostname. When this variable is set, SSL parameters in `DATABASE_URL` are ignored so a machine-local `sslrootcert` path cannot override the runtime TLS configuration. Keep the CA out of source, logs, and chat.
4. Create the single owner interactively with `npm run create:owner`. Set `OWNER_EMAIL` and optional `OWNER_NAME` in `.env.local`; enter the password only at the hidden terminal prompt. Copy the printed UUID into `ADMIN_USER_ID` in `.env.local` and restart the app.
5. Run `npm run dev` and open `http://localhost:3000`.

For operator recovery, set the verified owner UUID in `ADMIN_USER_ID`, run `npm run reset:owner-password` in a local interactive terminal, and enter the new password at the hidden prompt. The script replaces the hash and revokes existing sessions.

The application does not use Supabase Auth; public signup is disabled in the local Supabase CLI configuration. Better Auth handles owner email/password sessions in the private `app_auth` schema. Public catalog reads use the Supabase publishable key and RLS. `SUPABASE_SECRET_KEY` bypasses RLS: every admin Server Action or Route Handler must call `requireAdmin()` before creating/using the secret client. The key is server-only and must never be placed in a `NEXT_PUBLIC_` variable or client bundle.

## Checks

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

## Netlify preview and runtime configuration

The Netlify site should use `web` as its base directory. `netlify.toml` in this folder sets `npm run build` and `.next`; Netlify's Next.js runtime handles SSR, Route Handlers, Server Actions, and image optimization. Do not add a static-export setting.

Set runtime variables in Netlify's environment-variable UI, never in `netlify.toml`. Use the Supabase **development** project for Deploy Previews and grant `SUPABASE_SECRET_KEY` only to trusted build/function contexts. Required runtime values are `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DATABASE_URL` (restricted `mamitika_auth` role), `ADMIN_USER_ID`, `SITE_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SECRET_KEY`. Set the Deploy Preview context's `DATABASE_URL`, Supabase URL/keys, `BETTER_AUTH_URL`, and `SITE_URL` to development/preview values; never inherit production credentials. `OWNER_EMAIL` and `OWNER_NAME` are for the local owner-provisioning script, not runtime.

`NEXT_PUBLIC_*` values are included in browser code and must never contain secrets. `SITE_URL` is the final canonical origin for production; Deploy Previews use Netlify's preview URL. Set these in Netlify and redeploy after changing them. A preview remains blocked until its repository/site, isolated development credentials, and owner authentication are available.

## Database and Storage backup / recovery

Backups contain business settings, catalog rows, Better Auth user/session data, and possibly customer-facing media. Store them encrypted on a protected local or organization-controlled drive outside this repository. Never put backup files, passwords, connection strings, access tokens, or key material in Git, issues, or chat. The app's restricted `DATABASE_URL` role is not a full-project backup credential; use an operator-authorized Supabase CLI/database connection locally.

Before a backup, confirm the project ref in the Supabase Dashboard and CLI is the intended environment, and use the linked-project listing to verify it. Run from `web/` after interactive Supabase CLI login/linking; the CLI may require Docker and a database password prompt. Enter passwords only in the local prompt. These commands only export data:

```powershell
$backupRoot = Join-Path $env:LOCALAPPDATA ("Mamitika-backups\development\" + (Get-Date -Format "yyyyMMdd-HHmmss"))
New-Item -ItemType Directory -Path $backupRoot | Out-Null
npx --yes supabase@2.120.0 db dump --linked --file (Join-Path $backupRoot "schema.sql")
npx --yes supabase@2.120.0 db dump --linked --data-only --use-copy --file (Join-Path $backupRoot "data.sql")
npx --yes supabase@2.120.0 db dump --linked --role-only --file (Join-Path $backupRoot "roles.sql")
npx --yes supabase@2.120.0 storage cp ss:///catalog-images (Join-Path $backupRoot "catalog-images") --linked --recursive --experimental
Get-ChildItem -LiteralPath $backupRoot -Recurse -File | Get-FileHash -Algorithm SHA256
```

The database dump does **not** include Storage object bytes. Copy every required bucket separately, retain the database dump and object files together, and record checksums outside the repository. This command set has not yet been run for this project.

Restore is a separate, destructive operator operation. Do not restore over the current development project or production. First create/obtain an empty, isolated Supabase project approved for recovery; verify its project ref and confirm no application data exists. Restore schema/data and object files there using the current Supabase backup/restore guide, then verify product, gallery, settings, `app_auth`, bucket, and image-path counts before any app points to it. Reset custom role passwords out of band, because database backups do not preserve those passwords. If no empty isolated project and authorized database access are available, stop: restore validation remains pending. No backup or restore has been performed as part of T10.

Supabase references: [database backup guide](https://supabase.com/docs/guides/platform/backups), [CLI backup and restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), [Storage object download](https://supabase.com/docs/guides/storage/management/download-objects).

## Release and rollback

Read `RELEASE_CHECKS.md` before preview or publication. A code rollback in Netlify restores an earlier deploy; it does not roll back database mutations or uploaded Storage objects. For database recovery, stop writes and use the separately verified recovery copy/project. Do not use `db reset --linked` or restore commands on a project containing data.
