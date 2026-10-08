-- Run after the T03 migration in a local Supabase development database.
-- Better Auth identity and ADMIN_USER_ID checks are covered by auth.test.ts;
-- Better Auth users do not authenticate as Supabase JWT/RLS roles.
begin;

insert into public.products (
  id, slug, name, category, description, price_rupiah, is_active,
  image_path, image_alt, image_width, image_height
) values
  ('00000000-0000-4000-8000-0000000000a1', 't03-authz-active-fixture', 'T03 active fixture', 'roti', '', 1000, true, 't03/active.webp', 'Temporary active fixture', 1, 1),
  ('00000000-0000-4000-8000-0000000000a2', 't03-authz-inactive-fixture', 'T03 inactive fixture', 'roti', '', 1000, false, null, null, null, null);

insert into public.gallery_items (
  id, image_path, image_alt, image_width, image_height, is_active
) values
  ('00000000-0000-4000-8000-0000000000a4', 't03/gallery-active.webp', 'Temporary active gallery fixture', 1, 1, true),
  ('00000000-0000-4000-8000-0000000000a5', 't03/gallery-inactive.webp', 'Temporary inactive gallery fixture', 1, 1, false);

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
do $$
declare visible_count integer; gallery_count integer;
begin
  select count(*) into visible_count from public.products
  where id in ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a2');
  if visible_count <> 1 then raise exception 'anon must see only active products'; end if;
  select count(*) into gallery_count from public.gallery_items
  where id in ('00000000-0000-4000-8000-0000000000a4', '00000000-0000-4000-8000-0000000000a5');
  if gallery_count <> 1 then raise exception 'anon must see only active gallery items'; end if;
  begin
    insert into public.products (slug, name, category, price_rupiah) values ('anon-write', 'Anon', 'roti', 1);
    raise exception 'anon unexpectedly wrote a product';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
do $$
declare visible_count integer; changed_count integer;
begin
  select count(*) into visible_count from public.products
  where id in ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a2');
  if visible_count <> 1 then raise exception 'authenticated must see only active products'; end if;
  begin
    insert into public.products (slug, name, category, price_rupiah) values ('nonowner-write', 'Non-owner', 'roti', 1);
    raise exception 'non-owner unexpectedly wrote a product';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.products set name = 'Non-owner mutation' where id = '00000000-0000-4000-8000-0000000000a1';
    get diagnostics changed_count = row_count;
    if changed_count <> 0 then raise exception 'non-owner unexpectedly changed a product'; end if;
  exception when insufficient_privilege then null;
  end;
  if has_schema_privilege(current_user, 'app_auth', 'USAGE') then raise exception 'authenticated can access app_auth'; end if;
  if to_regclass('public.admin_users') is not null then raise exception 'legacy admin_users table still exists'; end if;
end;
$$;
reset role;

-- The dedicated runtime role can manage auth rows, but is not privileged to
-- create objects, bypass RLS, or access the public catalog.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'mamitika_auth' and rolcanlogin and not rolsuper and not rolcreatedb and not rolcreaterole and not rolbypassrls) then
    raise exception 'mamitika_auth must remain a restricted login role';
  end if;
  if not has_table_privilege('mamitika_auth', 'app_auth.user', 'select') or not has_table_privilege('mamitika_auth', 'app_auth.user', 'insert') or not has_table_privilege('mamitika_auth', 'app_auth.user', 'update') or not has_table_privilege('mamitika_auth', 'app_auth.user', 'delete') then raise exception 'auth runtime role needs user DML'; end if;
  if not has_table_privilege('mamitika_auth', 'app_auth.session', 'select') or not has_table_privilege('mamitika_auth', 'app_auth.session', 'insert') or not has_table_privilege('mamitika_auth', 'app_auth.session', 'update') or not has_table_privilege('mamitika_auth', 'app_auth.session', 'delete') then raise exception 'auth runtime role needs session DML'; end if;
  if has_schema_privilege('mamitika_auth', 'public', 'CREATE') then raise exception 'auth runtime role cannot create public objects'; end if;
  if has_table_privilege('mamitika_auth', 'public.products', 'insert') or has_table_privilege('mamitika_auth', 'public.products', 'update') or has_table_privilege('mamitika_auth', 'public.products', 'delete') then raise exception 'auth runtime role cannot mutate catalog directly'; end if;
  if has_schema_privilege('anon', 'app_auth', 'USAGE') or has_schema_privilege('authenticated', 'app_auth', 'USAGE') then raise exception 'Supabase API roles cannot use app_auth'; end if;
end;
$$;

rollback;
