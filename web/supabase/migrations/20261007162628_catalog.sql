-- T03: application schema, explicit Data API grants, and owner-only mutation.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (char_length(slug) between 1 and 160 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (name = btrim(name) and char_length(name) between 1 and 120),
  category text not null check (category in ('roti', 'kue_basah', 'risoles_lumpia')),
  description text not null default '' check (char_length(description) <= 1200),
  price_rupiah integer not null check (price_rupiah > 0),
  package_label text check (package_label is null or (package_label = btrim(package_label) and char_length(package_label) between 1 and 80)),
  quantity_unit text check (quantity_unit is null or (quantity_unit = btrim(quantity_unit) and char_length(quantity_unit) between 1 and 40)),
  availability text not null default 'unconfirmed'
    check (availability in ('unconfirmed', 'ready', 'preorder', 'unavailable')),
  preorder_lead_days integer check (preorder_lead_days is null or preorder_lead_days >= 0),
  is_active boolean not null default false,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  image_path text check (image_path is null or (char_length(image_path) <= 500 and image_path !~ '(^/|(^|/)\.\.?(/|$)|^https?://)')),
  image_alt text check (image_alt is null or char_length(image_alt) between 1 and 180),
  image_width integer check (image_width is null or image_width > 0),
  image_height integer check (image_height is null or image_height > 0),
  image_position_x integer not null default 50 check (image_position_x between 0 and 100),
  image_position_y integer not null default 50 check (image_position_y between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((image_width is null) = (image_height is null)),
  check (not is_active or (image_path is not null and image_alt is not null and image_width is not null and image_height is not null))
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  image_path text not null check (char_length(image_path) between 1 and 500 and image_path !~ '(^/|(^|/)\.\.?(/|$)|^https?://)'),
  image_alt text not null check (image_alt = btrim(image_alt) and char_length(image_alt) between 1 and 180),
  caption text check (caption is null or char_length(caption) <= 240),
  image_width integer not null check (image_width > 0),
  image_height integer not null check (image_height > 0),
  sort_order integer not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  whatsapp_number text not null check (whatsapp_number ~ '^[1-9][0-9]{7,14}$'),
  instagram_url text not null check (instagram_url ~ '^https://[^[:space:]]+$'),
  address_text text not null check (address_text = btrim(address_text) and char_length(address_text) between 1 and 300),
  maps_url text check (maps_url is null or maps_url ~ '^https://[^[:space:]]+$'),
  opening_time time not null default '06:30',
  closing_time time not null default '17:00',
  timezone text not null default 'Asia/Jakarta' check (timezone = 'Asia/Jakarta'),
  service_days_text text check (service_days_text is null or char_length(service_days_text) <= 160),
  delivery_note text check (delivery_note is null or char_length(delivery_note) <= 500),
  pickup_note text check (pickup_note is null or char_length(pickup_note) <= 500),
  gofood_url text check (gofood_url is null or gofood_url ~ '^https://[^[:space:]]+$'),
  shopeefood_url text check (shopeefood_url is null or shopeefood_url ~ '^https://[^[:space:]]+$'),
  snack_min_boxes integer check (snack_min_boxes is null or snack_min_boxes > 0),
  snack_lead_days integer check (snack_lead_days is null or snack_lead_days >= 0),
  snack_description text check (snack_description is null or char_length(snack_description) <= 1200),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (
  id, whatsapp_number, instagram_url, address_text, opening_time, closing_time
) values (
  1, '6283197665812', 'https://www.instagram.com/kuenyamamitika',
  'The Royal Stavana E9, Derwati, Bandung', '06:30', '17:00'
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index products_public_order_idx on public.products (sort_order, name, id) where is_active;
create index gallery_items_public_order_idx on public.gallery_items (sort_order, id) where is_active;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create function public.prevent_product_slug_change()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.slug is distinct from old.slug then
    raise exception 'Product slugs are immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.prevent_product_slug_change() from public, anon, authenticated;

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger products_prevent_slug_change
before update on public.products
for each row execute function public.prevent_product_slug_change();

create trigger gallery_items_set_updated_at
before update on public.gallery_items
for each row execute function public.set_updated_at();

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.gallery_items enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_users enable row level security;

grant usage on schema public to anon, authenticated;

revoke all on table public.products, public.gallery_items, public.site_settings, public.admin_users from anon, authenticated;
grant select on table public.products, public.gallery_items, public.site_settings to anon, authenticated;
grant insert, update on table public.products, public.gallery_items to authenticated;
grant update (
  whatsapp_number, instagram_url, address_text, maps_url, opening_time, closing_time,
  service_days_text, delivery_note, pickup_note, gofood_url, shopeefood_url,
  snack_min_boxes, snack_lead_days, snack_description
) on public.site_settings to authenticated;
grant select (user_id, created_at) on public.admin_users to authenticated;

create policy products_read_public_or_owner
on public.products for select to anon, authenticated
using (
  is_active
  or exists (select 1 from public.admin_users where user_id = (select auth.uid()))
);

create policy products_insert_owner
on public.products for insert to authenticated
with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

create policy products_update_owner
on public.products for update to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

create policy gallery_items_read_public_or_owner
on public.gallery_items for select to anon, authenticated
using (
  is_active
  or exists (select 1 from public.admin_users where user_id = (select auth.uid()))
);

create policy gallery_items_insert_owner
on public.gallery_items for insert to authenticated
with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

create policy gallery_items_update_owner
on public.gallery_items for update to authenticated
using (exists (select 1 from public.admin_users where user_id = (select auth.uid())))
with check (exists (select 1 from public.admin_users where user_id = (select auth.uid())));

create policy site_settings_read_public
on public.site_settings for select to anon, authenticated
using (id = 1);

create policy site_settings_update_owner
on public.site_settings for update to authenticated
using (id = 1 and exists (select 1 from public.admin_users where user_id = (select auth.uid())))
with check (id = 1 and exists (select 1 from public.admin_users where user_id = (select auth.uid())));

create policy admin_users_read_self
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog-images', 'catalog-images', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set name = excluded.name,
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Storage's objects table and grants are platform-managed. Public reads are
-- provided by the public bucket; trusted admin uploads use the server-only key
-- after requireAdmin() and therefore do not need end-user Storage policies.
