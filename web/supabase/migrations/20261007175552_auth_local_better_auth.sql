-- Forward migration: Supabase Auth is no longer the admin identity provider.
-- Better Auth uses its own private PostgreSQL schema and restricted role.

create schema if not exists app_auth;
revoke all on schema app_auth from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'mamitika_auth') then
    create role mamitika_auth login nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
  end if;
end;
$$;
do $$ begin
  execute format('grant connect on database %I to mamitika_auth', current_database());
end $$;
grant usage on schema app_auth to mamitika_auth;

create table app_auth."user" (
  id text primary key,
  name text not null,
  email text not null unique,
  "emailVerified" boolean not null default false,
  image text,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now()
);

create table app_auth."session" (
  id text primary key,
  "expiresAt" timestamp not null,
  token text not null unique,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references app_auth."user" (id) on delete cascade
);
create index session_user_id_idx on app_auth."session" ("userId");

create table app_auth.account (
  id text primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references app_auth."user" (id) on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp,
  "refreshTokenExpiresAt" timestamp,
  scope text,
  password text,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now()
);
create index account_user_id_idx on app_auth.account ("userId");

create table app_auth.verification (
  id text primary key,
  identifier text not null,
  value text not null,
  "expiresAt" timestamp not null,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now()
);
create index verification_identifier_idx on app_auth.verification (identifier);

create table app_auth."rateLimit" (
  id text primary key,
  key text not null unique,
  count integer not null,
  "lastRequest" bigint not null
);

revoke all on all tables in schema app_auth from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema app_auth to mamitika_auth;

-- Better Auth identities are not Supabase RLS identities.
drop policy if exists products_read_public_or_owner on public.products;
drop policy if exists products_insert_owner on public.products;
drop policy if exists products_update_owner on public.products;
drop policy if exists gallery_items_read_public_or_owner on public.gallery_items;
drop policy if exists gallery_items_insert_owner on public.gallery_items;
drop policy if exists gallery_items_update_owner on public.gallery_items;
drop policy if exists site_settings_read_public on public.site_settings;
drop policy if exists site_settings_update_owner on public.site_settings;
drop policy if exists admin_users_read_self on public.admin_users;
drop table if exists public.admin_users cascade;

revoke all on table public.products, public.gallery_items, public.site_settings from public, anon, authenticated;
grant select on table public.products, public.gallery_items, public.site_settings to anon, authenticated;

create policy products_read_active
on public.products for select to anon, authenticated using (is_active);
create policy gallery_items_read_active
on public.gallery_items for select to anon, authenticated using (is_active);
create policy site_settings_read_public
on public.site_settings for select to anon, authenticated using (id = 1);

-- Set the role password out of band before DATABASE_URL is configured.
