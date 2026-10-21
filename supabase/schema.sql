-- =====================================================================
--  سوگ — راه‌اندازی پایگاه داده در Supabase
--  کل این فایل را در Supabase → SQL Editor اجرا کنید (یک‌بار کافی است؛
--  اجرای دوباره هم چیزی را خراب نمی‌کند).
--
--  قاعده‌ها:
--  • بازدیدکننده (anon) فقط محتوای منتشرشده را می‌بیند و فقط می‌تواند
--    آگهی/کسب‌وکار برای بررسی، همدردی، گزارش خطا و پیام پشتیبانی بفرستد.
--  • اطلاعات شخصی (تلفن، کد ملی) فقط برای مدیر قابل خواندن است.
--  • مدیر کسی است که با ایمیلش در Authentication وارد شود و ایمیلش در
--    جدول admins باشد (پایین همین فایل).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- مدیران ----------
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- ارسال‌های در انتظار بررسی (آگهی و کسب‌وکار) ----------
-- payload شامل فرم کامل است (تلفن و کد ملی ثبت‌کننده هم)، پس فقط مدیر می‌خواند.
create table if not exists public.submissions (
  id           bigint generated always as identity primary key,
  kind         text not null check (kind in ('listing', 'business')),
  payload      jsonb not null,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  published_id text,
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);
alter table public.submissions enable row level security;
drop policy if exists "submissions: anyone can send" on public.submissions;
create policy "submissions: anyone can send" on public.submissions
  for insert to anon, authenticated
  with check (status = 'pending' and published_id is null and reviewed_at is null
              and octet_length(payload::text) < 400000);
drop policy if exists "submissions: admin reads" on public.submissions;
create policy "submissions: admin reads" on public.submissions
  for select to authenticated using (public.is_admin());
drop policy if exists "submissions: admin updates" on public.submissions;
create policy "submissions: admin updates" on public.submissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "submissions: admin deletes" on public.submissions;
create policy "submissions: admin deletes" on public.submissions
  for delete to authenticated using (public.is_admin());

-- ---------- آگهی‌ها و کسب‌وکارهای منتشرشده ----------
-- data همان شکل آگهی در data/listings.json (یا کسب‌وکار در data/businesses.json) است.
create table if not exists public.listings (
  id         text primary key,
  data       jsonb not null,
  status     text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now()
);
create table if not exists public.businesses (
  id         text primary key,
  data       jsonb not null,
  status     text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now()
);
alter table public.listings enable row level security;
alter table public.businesses enable row level security;
drop policy if exists "listings: public reads published" on public.listings;
create policy "listings: public reads published" on public.listings
  for select to anon, authenticated using (status = 'published' or public.is_admin());
drop policy if exists "listings: admin writes" on public.listings;
create policy "listings: admin writes" on public.listings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "businesses: public reads published" on public.businesses;
create policy "businesses: public reads published" on public.businesses
  for select to anon, authenticated using (status = 'published' or public.is_admin());
drop policy if exists "businesses: admin writes" on public.businesses;
create policy "businesses: admin writes" on public.businesses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- همدردی‌ها ----------
-- کد ملی (org_melli) و رمز ویرایش (owner_token) برای بازدیدکننده خوانا نیست.
create table if not exists public.condolences (
  id          bigint generated always as identity primary key,
  listing_id  text not null,
  name        text not null check (char_length(name) between 2 and 120),
  message     text not null check (char_length(message) between 1 and 3000),
  kind        text not null default 'person' check (kind in ('person', 'org')),
  org_melli   text,
  avatar_url  text,
  verified    boolean not null default false,
  status      text not null default 'published' check (status in ('published', 'hidden', 'deleted')),
  owner_token uuid not null default gen_random_uuid(),
  created_at  timestamptz not null default now()
);
alter table public.condolences add column if not exists avatar_url text;
create index if not exists condolences_listing_idx on public.condolences (listing_id, created_at);
alter table public.condolences enable row level security;
revoke all on public.condolences from anon, authenticated;
grant select (id, listing_id, name, message, kind, avatar_url, verified, status, created_at) on public.condolences to anon;
grant select, update, delete on public.condolences to authenticated;
drop policy if exists "condolences: public reads published" on public.condolences;
create policy "condolences: public reads published" on public.condolences
  for select to anon, authenticated using (status = 'published' or public.is_admin());
drop policy if exists "condolences: admin updates" on public.condolences;
create policy "condolences: admin updates" on public.condolences
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "condolences: admin deletes" on public.condolences;
create policy "condolences: admin deletes" on public.condolences
  for delete to authenticated using (public.is_admin());

-- ثبت همدردی؛ رمز ویرایش فقط به خودِ نویسنده برگردانده می‌شود
drop function if exists public.add_condolence(text, text, text, text, text);
drop function if exists public.edit_condolence(bigint, uuid, text, text, text, text);
create or replace function public.add_condolence(p_listing text, p_name text, p_message text,
                                                 p_kind text default 'person', p_melli text default null,
                                                 p_avatar text default null)
returns table (id bigint, owner_token uuid)
language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('person', 'org') then raise exception 'bad kind'; end if;
  if p_kind = 'org' and (p_melli is null or p_melli !~ '^[0-9]{10}$') then raise exception 'melli required'; end if;
  return query
    insert into public.condolences (listing_id, name, message, kind, org_melli, avatar_url)
    values (left(p_listing, 80), trim(p_name), trim(p_message), p_kind, case when p_kind = 'org' then p_melli end,
            case when p_avatar ~ '^https://' then left(p_avatar, 500) end)
    returning condolences.id, condolences.owner_token;
end $$;

create or replace function public.edit_condolence(p_id bigint, p_token uuid, p_name text, p_message text,
                                                  p_kind text default 'person', p_melli text default null,
                                                  p_avatar text default null)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('person', 'org') then raise exception 'bad kind'; end if;
  if p_kind = 'org' and (p_melli is null or p_melli !~ '^[0-9]{10}$') then raise exception 'melli required'; end if;
  update public.condolences
     set name = trim(p_name), message = trim(p_message), kind = p_kind,
         avatar_url = case when p_avatar ~ '^https://' then left(p_avatar, 500) else avatar_url end,
         org_melli = case when p_kind = 'org' then p_melli end,
         verified = case when p_kind = 'org' and kind = 'org' and org_melli = p_melli then verified else false end
   where condolences.id = p_id and owner_token = p_token and status <> 'deleted';
  return found;
end $$;

create or replace function public.delete_condolence(p_id bigint, p_token uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.condolences set status = 'deleted'
   where condolences.id = p_id and owner_token = p_token;
  return found;
end $$;
revoke all on function public.add_condolence(text, text, text, text, text, text) from public;
revoke all on function public.edit_condolence(bigint, uuid, text, text, text, text, text) from public;
revoke all on function public.delete_condolence(bigint, uuid) from public;
grant execute on function public.add_condolence(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.edit_condolence(bigint, uuid, text, text, text, text, text) to anon, authenticated;
grant execute on function public.delete_condolence(bigint, uuid) to anon, authenticated;

-- ---------- گزارش‌های خطا ----------
create table if not exists public.reports (
  id          bigint generated always as identity primary key,
  kind        text not null default 'listing' check (kind in ('listing', 'business', 'condolence')),
  target_id   text,
  target_name text,
  type        text,
  note        text check (char_length(note) <= 3000),
  photo_url   text,
  status      text not null default 'open' check (status in ('open', 'done')),
  created_at  timestamptz not null default now()
);
-- target_ref: کدام همدردی («db:شناسه» یا «json:نام|تاریخ»)؛ reporter: شناسه‌ی تصادفی دستگاه گزارش‌دهنده
alter table public.reports add column if not exists target_ref text;
alter table public.reports add column if not exists reporter text;
alter table public.reports add column if not exists auto_hidden boolean not null default false;
create index if not exists reports_target_idx on public.reports (kind, target_id, target_ref) where status = 'open';
alter table public.reports enable row level security;
drop policy if exists "reports: anyone can send" on public.reports;
create policy "reports: anyone can send" on public.reports
  for insert to anon, authenticated with check (status = 'open' and auto_hidden = false);

-- پنهان‌شدن خودکار: وقتی گزارش‌های باز یک مورد از دستگاه‌های مختلف به حد تعیین‌شده
-- (پیش‌فرض ۳، از تنظیمات پنل؛ صفر = خاموش) برسد، آن مورد تا بررسی مدیر پنهان می‌شود.
create or replace function public.reports_autohide() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  lim int;
  n int;
  st jsonb;
  grp text;
  k text;
  cur jsonb;
begin
  select coalesce(nullif(state -> 'settings' ->> 'reportHideAt', '')::int, 3), coalesce(state, '{}'::jsonb)
    into lim, st from public.site_state where id = 1;
  if lim is null or lim < 1 then return new; end if;

  select count(distinct coalesce(reporter, 'r' || id)) into n
    from public.reports
   where status = 'open' and kind = new.kind
     and coalesce(target_id, '') = coalesce(new.target_id, '')
     and coalesce(target_ref, '') = coalesce(new.target_ref, '');
  if n < lim then return new; end if;

  if new.kind = 'condolence' and new.target_ref like 'db:%' then
    update public.condolences set status = 'hidden'
     where id = substring(new.target_ref from 4)::bigint and status = 'published';
  else
    if new.kind = 'condolence' then
      grp := 'condolences';
      k := new.target_id || '|' || substring(coalesce(new.target_ref, '') from 6);   -- «json:» برداشته می‌شود
    elsif new.kind = 'business' then
      grp := 'businesses'; k := new.target_id;
    else
      grp := 'listings'; k := new.target_id;
    end if;
    cur := coalesce(st -> grp -> k, '{}'::jsonb);
    if coalesce(cur ->> 'status', 'published') = 'published' then
      st := jsonb_set(st, array[grp], coalesce(st -> grp, '{}'::jsonb), true);
      st := jsonb_set(st, array[grp, k], cur || '{"status": "hidden", "autoHidden": true}'::jsonb, true);
      update public.site_state set state = st, updated_at = now() where id = 1;
    end if;
  end if;

  update public.reports set auto_hidden = true
   where status = 'open' and kind = new.kind
     and coalesce(target_id, '') = coalesce(new.target_id, '')
     and coalesce(target_ref, '') = coalesce(new.target_ref, '');
  return new;
end $$;
revoke all on function public.reports_autohide() from public, anon, authenticated;
drop trigger if exists reports_autohide on public.reports;
create trigger reports_autohide after insert on public.reports
  for each row execute function public.reports_autohide();
drop policy if exists "reports: admin manages" on public.reports;
create policy "reports: admin manages" on public.reports
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- پیام‌های پشتیبانی ----------
-- هر دستگاه یک شناسه‌ی گفت‌وگوی تصادفی و طولانی دارد و فقط پیام‌های همان را می‌خواند.
create table if not exists public.support_messages (
  id         bigint generated always as identity primary key,
  thread_id  text not null check (char_length(thread_id) between 20 and 80),
  sender     text not null check (sender in ('user', 'support')),
  body       text check (char_length(body) <= 4000),
  audio_url  text,
  user_name  text,
  user_phone text,
  created_at timestamptz not null default now()
);
create index if not exists support_thread_idx on public.support_messages (thread_id, id);
alter table public.support_messages enable row level security;
drop policy if exists "support: user sends" on public.support_messages;
create policy "support: user sends" on public.support_messages
  for insert to anon, authenticated with check (sender = 'user');
drop policy if exists "support: admin manages" on public.support_messages;
create policy "support: admin manages" on public.support_messages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.get_thread(p_thread text, p_after bigint default 0)
returns table (id bigint, sender text, body text, audio_url text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select m.id, m.sender, m.body, m.audio_url, m.created_at
    from public.support_messages m
   where char_length(p_thread) >= 20 and m.thread_id = p_thread and m.id > coalesce(p_after, 0)
   order by m.id
   limit 500;
$$;
revoke all on function public.get_thread(text, bigint) from public;
grant execute on function public.get_thread(text, bigint) to anon, authenticated;

-- ---------- مالکیت آگهی (برای صندوق پیام و گزارش‌های آگهی‌های من) ----------
-- ثبت‌کننده هنگام ثبت یک رمز تصادفی می‌سازد که فقط روی دستگاه خودش می‌ماند؛
-- مدیر هنگام تأیید یا رد، رمز را به شناسه‌ی آگهی وصل می‌کند.
create table if not exists public.listing_owners (
  listing_id text primary key,
  token      uuid not null,
  created_at timestamptz not null default now()
);
alter table public.listing_owners enable row level security;
revoke all on public.listing_owners from anon;
drop policy if exists "listing_owners: admin manages" on public.listing_owners;
create policy "listing_owners: admin manages" on public.listing_owners
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- پیام‌های مدیریتی و خبری ----------
-- target_listing خالی = برای همه؛ وگرنه فقط برای ثبت‌کننده‌ی همان آگهی
create table if not exists public.messages (
  id             bigint generated always as identity primary key,
  title          text not null check (char_length(title) between 1 and 200),
  body           text not null default '' check (char_length(body) <= 4000),
  kind           text not null default 'news' check (kind in ('news', 'admin')),
  target_listing text,
  created_at     timestamptz not null default now()
);
alter table public.messages enable row level security;
revoke all on public.messages from anon;
drop policy if exists "messages: admin manages" on public.messages;
create policy "messages: admin manages" on public.messages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- p_items: [{"id": "<شناسه‌ی آگهی>", "token": "<رمز مالکیت>"}, ...]
create or replace function public.my_inbox(p_items jsonb default '[]'::jsonb)
returns table (id bigint, title text, body text, kind text, target_listing text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  with mine as (
    select o.listing_id
      from public.listing_owners o
      join jsonb_array_elements(case when jsonb_typeof(p_items) = 'array' and jsonb_array_length(p_items) <= 300 then p_items else '[]'::jsonb end) e
        on o.listing_id = e ->> 'id' and o.token::text = e ->> 'token'
  )
  select m.id, m.title, m.body, m.kind, m.target_listing, m.created_at
    from public.messages m
   where m.target_listing is null or m.target_listing in (select listing_id from mine)
   order by m.id desc
   limit 200;
$$;

create or replace function public.my_listing_reports(p_items jsonb default '[]'::jsonb)
returns table (id bigint, kind text, target_id text, target_name text, type text, note text, status text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  with mine as (
    select o.listing_id
      from public.listing_owners o
      join jsonb_array_elements(case when jsonb_typeof(p_items) = 'array' and jsonb_array_length(p_items) <= 300 then p_items else '[]'::jsonb end) e
        on o.listing_id = e ->> 'id' and o.token::text = e ->> 'token'
  )
  select r.id, r.kind, r.target_id, r.target_name, r.type, r.note, r.status, r.created_at
    from public.reports r
   where r.kind in ('listing', 'condolence') and r.target_id in (select listing_id from mine)
   order by r.id desc
   limit 300;
$$;
revoke all on function public.my_inbox(jsonb) from public;
revoke all on function public.my_listing_reports(jsonb) from public;
grant execute on function public.my_inbox(jsonb) to anon, authenticated;
grant execute on function public.my_listing_reports(jsonb) to anon, authenticated;

-- ---------- تصمیم‌ها و تنظیمات مدیر (یک ردیف) ----------
create table if not exists public.site_state (
  id         int primary key default 1 check (id = 1),
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.site_state (id) values (1) on conflict (id) do nothing;
alter table public.site_state enable row level security;
drop policy if exists "site_state: public reads" on public.site_state;
create policy "site_state: public reads" on public.site_state
  for select to anon, authenticated using (true);
drop policy if exists "site_state: admin updates" on public.site_state;
create policy "site_state: admin updates" on public.site_state
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- فایل‌ها (عکس و صدا) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 8388608,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif',
              'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/webm', 'audio/ogg', 'audio/wav'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "uploads: anyone can add" on storage.objects;
create policy "uploads: anyone can add" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'uploads');
drop policy if exists "uploads: admin deletes" on storage.objects;
create policy "uploads: admin deletes" on storage.objects
  for delete to authenticated using (bucket_id = 'uploads' and public.is_admin());

-- به‌روز کردن فهرست جدول‌ها و ستون‌ها در API (Supabase معمولاً خودش انجام می‌دهد)
notify pgrst, 'reload schema';

-- =====================================================================
--  آخرین قدم: ایمیل مدیر را اینجا بنویسید و فقط همین خط را اجرا کنید
--  (همان ایمیلی که در Authentication → Users ساخته‌اید):
--
--  insert into public.admins (email) values ('ایمیل-شما@example.com') on conflict do nothing;
-- =====================================================================
