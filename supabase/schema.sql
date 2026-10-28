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
-- اشتراک: ماه اول رایگان، سپس تمدید ماهانه. data.paid_until (میلی‌ثانیه) که بگذرد،
-- کسب‌وکار برای عموم دیده نمی‌شود تا مدیر تمدیدش کند. کسب‌وکار بدون paid_until همیشه فعال است.
create policy "businesses: public reads published" on public.businesses
  for select to anon, authenticated using (
    public.is_admin() or (
      status = 'published' and
      case when jsonb_typeof(data->'paid_until') = 'number'
           then (data->>'paid_until')::numeric > extract(epoch from now()) * 1000
           else true end
    ));
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
alter table public.condolences add column if not exists donated boolean not null default false;
create index if not exists condolences_listing_idx on public.condolences (listing_id, created_at);
alter table public.condolences enable row level security;
revoke all on public.condolences from anon, authenticated;
grant select (id, listing_id, name, message, kind, avatar_url, donated, verified, status, created_at) on public.condolences to anon;
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
-- نویسنده‌ی همدردی اعلام می‌کند که به نیت درگذشته خیرات کرده است (نشان «خیرات کرده»)
create or replace function public.mark_condolence_donated(p_id bigint, p_token uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.condolences set donated = true
   where condolences.id = p_id and owner_token = p_token and status <> 'deleted';
  return found;
end $$;
revoke all on function public.mark_condolence_donated(bigint, uuid) from public;
grant execute on function public.mark_condolence_donated(bigint, uuid) to anon, authenticated;

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

-- ---------- مدیران همکار آگهی (خانواده و نزدیکان) ----------
-- ثبت‌کننده برای هر نفر یک لینک دعوت می‌سازد؛ با باز کردن لینک، آن نفر رمز مدیریت خودش را می‌گیرد
-- و مثل ثبت‌کننده پیام‌ها، گزارش‌ها و خیرات‌ها را می‌بیند و همدردی‌ها را مدیریت می‌کند.
-- حذف آگهی و افزودن/حذف مدیر فقط کار خودِ ثبت‌کننده است.
create table if not exists public.listing_managers (
  id          bigint generated always as identity primary key,
  listing_id  text not null,
  name        text not null check (char_length(name) between 2 and 80),
  relation    text check (char_length(relation) <= 40),
  invite      uuid not null unique default gen_random_uuid(),
  token       uuid unique,
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists listing_managers_listing_idx on public.listing_managers (listing_id);
alter table public.listing_managers enable row level security;
revoke all on public.listing_managers from anon;
drop policy if exists "listing_managers: admin manages" on public.listing_managers;
create policy "listing_managers: admin manages" on public.listing_managers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- هر رمزی که اجازه‌ی مدیریت یک آگهی را می‌دهد: ثبت‌کننده + مدیرانِ پذیرفته‌شده
create or replace view public.listing_access as
  select listing_id, token from public.listing_owners
  union all
  select listing_id, token from public.listing_managers where token is not null;
revoke all on public.listing_access from anon, authenticated;

create or replace function public.add_listing_manager(p_id text, p_owner uuid, p_name text, p_relation text default null)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  if not exists (select 1 from public.listing_owners where listing_id = p_id and token = p_owner) then
    raise exception 'not owner';
  end if;
  if (select count(*) from public.listing_managers where listing_id = p_id) >= 10 then raise exception 'too many'; end if;
  insert into public.listing_managers (listing_id, name, relation)
  values (p_id, left(trim(p_name), 80), nullif(left(trim(coalesce(p_relation, '')), 40), ''))
  returning invite into v;
  return v;
end $$;

create or replace function public.list_listing_managers(p_id text, p_owner uuid)
returns table (id bigint, name text, relation text, invite uuid, accepted boolean, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select m.id, m.name, m.relation, m.invite, m.token is not null, m.created_at
    from public.listing_managers m
   where m.listing_id = p_id
     and exists (select 1 from public.listing_owners o where o.listing_id = p_id and o.token = p_owner)
   order by m.id;
$$;

create or replace function public.remove_listing_manager(p_id text, p_owner uuid, p_manager bigint)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.listing_owners where listing_id = p_id and token = p_owner) then return false; end if;
  delete from public.listing_managers where id = p_manager and listing_id = p_id;
  return found;
end $$;

-- پذیرفتن دعوت: هر لینک یک‌بار مصرف است و رمز تازه‌ای به مدیر می‌دهد
create or replace function public.accept_listing_manager(p_id text, p_invite uuid)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid := gen_random_uuid();
begin
  update public.listing_managers set token = v, accepted_at = now()
   where listing_id = p_id and invite = p_invite and token is null;
  if not found then return null; end if;
  return v;
end $$;

revoke all on function public.add_listing_manager(text, uuid, text, text) from public;
revoke all on function public.list_listing_managers(text, uuid) from public;
revoke all on function public.remove_listing_manager(text, uuid, bigint) from public;
revoke all on function public.accept_listing_manager(text, uuid) from public;
grant execute on function public.add_listing_manager(text, uuid, text, text) to anon, authenticated;
grant execute on function public.list_listing_managers(text, uuid) to anon, authenticated;
grant execute on function public.remove_listing_manager(text, uuid, bigint) to anon, authenticated;
grant execute on function public.accept_listing_manager(text, uuid) to anon, authenticated;

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
      from public.listing_access o
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
      from public.listing_access o
      join jsonb_array_elements(case when jsonb_typeof(p_items) = 'array' and jsonb_array_length(p_items) <= 300 then p_items else '[]'::jsonb end) e
        on o.listing_id = e ->> 'id' and o.token::text = e ->> 'token'
  )
  select r.id, r.kind, r.target_id, r.target_name, r.type, r.note, r.status, r.created_at
    from public.reports r
   where r.kind in ('listing', 'condolence') and r.target_id in (select listing_id from mine)
   order by r.id desc
   limit 300;
$$;
-- ---------- خیرات به نیت درگذشته ----------
-- هر بار که بازدیدکننده دکمه‌ی پرداخت خیرات را می‌زند یک ردیف ثبت می‌شود (اعلام خودِ خیّر؛ پرداخت در سایت مؤسسه است).
-- فهرست فقط با رمز مالکیت آگهی (my_listing_donations) به ثبت‌کننده‌ی سوگ نشان داده می‌شود.
create table if not exists public.donations (
  id           bigint generated always as identity primary key,
  listing_id   text not null,
  donor_name   text,
  charity_name text not null check (char_length(charity_name) between 1 and 120),
  amount       bigint not null check (amount between 1000 and 10000000000),
  created_at   timestamptz not null default now()
);
create index if not exists donations_listing_idx on public.donations (listing_id, created_at);
alter table public.donations enable row level security;
revoke all on public.donations from anon, authenticated;
grant select on public.donations to authenticated;
drop policy if exists "donations: admin reads" on public.donations;
create policy "donations: admin reads" on public.donations
  for select to authenticated using (public.is_admin());

drop function if exists public.add_donation(text, text, text, bigint);
-- ثبت خیرات + پیام در صندوق پیام ثبت‌کننده‌ی سوگ (my_inbox)
create or replace function public.add_donation(p_listing text, p_name text, p_charity text, p_amount bigint,
                                               p_deceased text default null)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_name  text := nullif(left(trim(coalesce(p_name, '')), 120), '');
  v_dead  text := nullif(left(trim(coalesce(p_deceased, '')), 120), '');
  v_money text := translate(to_char(p_amount, 'FM999,999,999,999'), '0123456789,', '۰۱۲۳۴۵۶۷۸۹٬') || ' تومان';
begin
  insert into public.donations (listing_id, donor_name, charity_name, amount)
  values (left(p_listing, 80), v_name, left(trim(p_charity), 120), p_amount);
  insert into public.messages (title, body, kind, target_listing)
  values ('خیرات به نیت ' || coalesce(v_dead, 'درگذشته‌ی شما'),
          coalesce(v_name, 'یک نیکوکار') || ' مبلغ ' || v_money || ' به ' || left(trim(p_charity), 120) ||
            ' به نیت ' || coalesce(v_dead, 'درگذشته‌ی شما') || ' خیرات کرد.',
          'admin', left(p_listing, 80));
  return true;
end $$;
revoke all on function public.add_donation(text, text, text, bigint, text) from public;
grant execute on function public.add_donation(text, text, text, bigint, text) to anon, authenticated;

create or replace function public.my_listing_donations(p_items jsonb default '[]'::jsonb)
returns table (id bigint, listing_id text, donor_name text, charity_name text, amount bigint, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  with mine as (
    select o.listing_id
      from public.listing_access o
      join jsonb_array_elements(case when jsonb_typeof(p_items) = 'array' and jsonb_array_length(p_items) <= 300 then p_items else '[]'::jsonb end) e
        on o.listing_id = e ->> 'id' and o.token::text = e ->> 'token'
  )
  select d.id, d.listing_id, d.donor_name, d.charity_name, d.amount, d.created_at
    from public.donations d
   where d.listing_id in (select listing_id from mine)
   order by d.id desc
   limit 500;
$$;
revoke all on function public.my_listing_donations(jsonb) from public;
grant execute on function public.my_listing_donations(jsonb) to anon, authenticated;

-- حذف آگهی توسط ثبت‌کننده‌اش: نسخه‌ی منتشرشده پنهان و ارسال‌های در انتظارش لغو می‌شود
create or replace function public.owner_remove_listing(p_id text, p_token uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean := false;
begin
  if exists (select 1 from public.listing_owners where listing_id = p_id and token = p_token) then
    update public.listings set status = 'hidden' where id = p_id;
    ok := true;
  end if;
  update public.submissions set status = 'rejected', reviewed_at = now()
   where status = 'pending' and kind = 'listing'
     and payload ->> 'owner_token' = p_token::text and payload -> 'ad' ->> 'id' = p_id;
  if found then ok := true; end if;
  return ok;
end $$;
revoke all on function public.owner_remove_listing(text, uuid) from public;
grant execute on function public.owner_remove_listing(text, uuid) to anon, authenticated;

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

-- =====================================================================
-- ---------- ربات بررسی خودکار ----------
-- هر آگهی سوگ / اطلاعیه‌ی فوری که ثبت می‌شود و هر همدردی که نوشته می‌شود
-- همان لحظه در خود پایگاه داده بررسی می‌شود:
--   • اگر مشکلی نداشت، خودکار منتشر می‌شود (و به ثبت‌کننده پیام می‌رسد)؛
--   • اگر مشکوک بود، برای «بررسی کارشناس» در پنل مدیریت می‌ماند و دلیلش کنارش نوشته می‌شود.
-- کسب‌وکارها همیشه توسط کارشناس بررسی می‌شوند (اشتراک پولی و احراز هویت دارند).
-- خاموش/روشن کردن:  update public.bot_settings set enabled = false;
-- =====================================================================
create table if not exists public.bot_settings (
  id               int primary key default 1 check (id = 1),
  enabled          boolean not null default true,
  auto_listings    boolean not null default true,
  auto_condolences boolean not null default true
);
insert into public.bot_settings (id) values (1) on conflict (id) do nothing;
alter table public.bot_settings enable row level security;
revoke all on public.bot_settings from anon;
drop policy if exists "bot_settings: admin manages" on public.bot_settings;
create policy "bot_settings: admin manages" on public.bot_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- واژه‌های ممنوع/مشکوک؛ مدیر می‌تواند از SQL Editor اضافه یا حذف کند
create table if not exists public.bot_words (
  word   text primary key,
  reason text not null default 'واژه‌ی نامناسب'
);
alter table public.bot_words enable row level security;
revoke all on public.bot_words from anon;
drop policy if exists "bot_words: admin manages" on public.bot_words;
create policy "bot_words: admin manages" on public.bot_words
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
insert into public.bot_words (word, reason) values
  ('کثافت', 'توهین'), ('احمق', 'توهین'), ('الاغ', 'توهین'), ('بیشعور', 'توهین'), ('بی‌شعور', 'توهین'),
  ('حرومزاده', 'توهین'), ('حرامزاده', 'توهین'), ('جنده', 'توهین'), ('کونی', 'توهین'), ('کسکش', 'توهین'),
  ('کس کش', 'توهین'), ('مادرجنده', 'توهین'), ('پدرسگ', 'توهین'), ('پدر سگ', 'توهین'), ('گوه', 'توهین'),
  ('خفه شو', 'توهین'), ('گمشو', 'توهین'), ('لعنت بر', 'توهین'), ('حقش بود', 'توهین'), ('خوشحالم که مرد', 'توهین'),
  ('شرط بندی', 'تبلیغ'), ('شرط‌بندی', 'تبلیغ'), ('کازینو', 'تبلیغ'), ('بت فوروارد', 'تبلیغ'), ('وام فوری', 'تبلیغ'),
  ('خرید فالوور', 'تبلیغ'), ('فالوور', 'تبلیغ'), ('کسب درآمد', 'تبلیغ'), ('درآمد دلاری', 'تبلیغ'), ('ارز دیجیتال', 'تبلیغ'),
  ('تخفیف ویژه', 'تبلیغ'), ('سفارش دهید', 'تبلیغ'), ('عضو کانال', 'تبلیغ'), ('کانال تلگرام', 'تبلیغ'), ('پیج اینستاگرام', 'تبلیغ')
on conflict (word) do nothing;

alter table public.submissions add column if not exists review_note text;
alter table public.submissions add column if not exists reviewed_by text;
alter table public.condolences add column if not exists review_note text;

-- کد ملی ایران (۱۰ رقم با رقم کنترل)
create or replace function public.bot_melli_ok(p text) returns boolean
language plpgsql immutable as $$
declare s int := 0; i int; c int; d text;
begin
  d := translate(coalesce(p, ''), '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789');
  if d !~ '^[0-9]{10}$' or d ~ '^(\d)\1{9}$' then return false; end if;
  for i in 1..9 loop s := s + substr(d, i, 1)::int * (11 - i); end loop;
  s := s % 11; c := substr(d, 10, 1)::int;
  return (s < 2 and c = s) or (s >= 2 and c = 11 - s);
end $$;

-- متن را بررسی می‌کند و فهرست دلیل‌های مشکوک‌بودن را برمی‌گرداند (خالی = سالم)
create or replace function public.bot_text_flags(p_text text, p_allow_phone boolean default false)
returns text[]
language plpgsql stable security definer set search_path = public as $$
declare
  t text := lower(coalesce(p_text, ''));
  r text[] := '{}';
  w record;
begin
  -- نشانی فایل‌های خود سایت (عکس‌ها در Supabase Storage) لینک حساب نمی‌شود
  t := regexp_replace(t, 'https?://[a-z0-9.-]*supabase\.co[^"\s]*', '', 'g');
  t := translate(t, '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩يك', '01234567890123456789یک');
  for w in select word, reason from public.bot_words loop
    if position(lower(w.word) in t) > 0 then r := r || (w.reason || ': «' || w.word || '»'); end if;
  end loop;
  if t ~ '(https?://|www\.|t\.me/|telegram\.me|instagram\.com|wa\.me/|bit\.ly)' or t ~ '[a-z0-9-]+\.(ir|com|net|org|me|io|xyz)\b' then
    r := r || 'لینک بیرونی'::text;
  end if;
  if not p_allow_phone and t ~ '(\+98|0098|\m0)9[0-9]{9}' then r := r || 'شماره تلفن در متن'::text; end if;
  if t ~ '(.)\1{7,}' then r := r || 'حروف تکراری'::text; end if;
  return r;
end $$;

-- بررسی و (در صورت سالم بودن) انتشار یک ارسال
create or replace function public.bot_review_submission(p_id bigint) returns text
language plpgsql security definer set search_path = public as $$
declare
  s     public.submissions%rowtype;
  cfg   public.bot_settings%rowtype;
  f     jsonb; ad jsonb;
  r     text[] := '{}';
  nm    text; phone text; pub_id text; title text; d_y int; d_m int; d_d int;
  n     int; jy int;
begin
  select * into s from public.submissions where id = p_id for update;
  if not found or s.status <> 'pending' then return 'skip'; end if;
  select * into cfg from public.bot_settings where id = 1;
  if cfg.id is null or not cfg.enabled or not cfg.auto_listings then return 'off'; end if;
  if s.kind <> 'listing' then
    update public.submissions set review_note = 'کسب‌وکار: همیشه بررسی کارشناس', reviewed_by = 'bot' where id = p_id;
    return 'manual';
  end if;

  f  := coalesce(s.payload -> 'form', '{}'::jsonb);
  ad := coalesce(s.payload -> 'ad', '{}'::jsonb);
  nm := trim(coalesce(nullif(ad ->> 'deceased_name', ''), f ->> 'name', ''));
  phone := translate(coalesce(f ->> 'phone', ''), '۰۱۲۳۴۵۶۷۸۹', '0123456789');

  if char_length(nm) < 3 or char_length(nm) > 80 then r := r || 'نام درگذشته نامعتبر'::text; end if;
  if nm ~ '[0-9۰-۹@#$%^&*<>{}]' then r := r || 'نماد یا عدد در نام درگذشته'::text; end if;

  -- متن‌های آزاد آگهی (نام‌ها، توضیح، متن اطلاعیه، توضیح مراسم‌ها)
  r := r || public.bot_text_flags(concat_ws(' ', nm, ad ->> 'subtitle', ad ->> 'notice_text', ad ->> 'father', ad ->> 'mother',
             ad ->> 'location', f ->> 'brief', f ->> 'quick_note', f ->> 'applicant_name', f ->> 'relation', (f -> 'events')::text), true);

  -- تاریخ درگذشت در آینده
  begin
    d_y := nullif(translate(f -> 'death' ->> 'y', '۰۱۲۳۴۵۶۷۸۹', '0123456789'), '')::int;
    d_m := nullif(translate(f -> 'death' ->> 'm', '۰۱۲۳۴۵۶۷۸۹', '0123456789'), '')::int;
    d_d := nullif(translate(f -> 'death' ->> 'd', '۰۱۲۳۴۵۶۷۸۹', '0123456789'), '')::int;
    -- سال شمسی امروز ≈ سال میلادی − ۶۲۱ (از نوروز) ؛ فقط سال‌های آشکارا آینده رد می‌شوند
    jy := extract(year from now())::int - (case when extract(doy from now()) >= 80 then 621 else 622 end);
    if d_y is not null and d_y > jy then
      r := r || 'تاریخ درگذشت در آینده'::text;
    end if;
    if d_y is not null and d_y < 1300 then r := r || 'تاریخ درگذشت نامعتبر'::text; end if;
  exception when others then null;
  end;

  -- کد ملی ثبت‌کننده
  if coalesce(f ->> 'melli', '') <> '' and not public.bot_melli_ok(f ->> 'melli') then
    r := r || 'کد ملی ثبت‌کننده نامعتبر'::text;
  end if;

  -- ارسال پشت‌سرهم از یک شماره
  if phone <> '' then
    select count(*) into n from public.submissions
     where kind = 'listing' and id <> p_id and created_at > now() - interval '24 hours'
       and translate(coalesce(payload -> 'form' ->> 'phone', ''), '۰۱۲۳۴۵۶۷۸۹', '0123456789') = phone;
    if n >= 3 then r := r || ('ارسال زیاد از یک شماره (' || n + 1 || ' آگهی در ۲۴ ساعت)'); end if;
  end if;

  -- آگهی تکراری: همین نام و نام پدر در ۶۰ روز اخیر منتشر شده (ویرایش همان آگهی مستثناست)
  select count(*) into n from public.listings l
   where l.status = 'published' and l.created_at > now() - interval '60 days'
     and trim(l.data ->> 'deceased_name') = nm
     and coalesce(l.data ->> 'father', '') = coalesce(ad ->> 'father', '')
     and l.id <> coalesce(ad ->> 'id', '');
  if n > 0 then r := r || 'احتمال آگهی تکراری'::text; end if;

  if array_length(r, 1) > 0 then
    update public.submissions set review_note = array_to_string(r, ' · '), reviewed_by = 'bot' where id = p_id;
    if coalesce(s.payload ->> 'owner_token', '') ~ '^[0-9a-f-]{36}$' then
      pub_id := coalesce(nullif(ad ->> 'id', ''), 's' || p_id);
      insert into public.listing_owners (listing_id, token) values (pub_id, (s.payload ->> 'owner_token')::uuid)
        on conflict (listing_id) do update set token = excluded.token;
      insert into public.messages (title, body, kind, target_listing)
      values ('آگهی «' || nm || '» در حال بررسی است',
              'آگهی شما برای بررسی بیشتر به کارشناس سپرده شد و پس از تأیید منتشر می‌شود.', 'admin', pub_id);
    end if;
    return 'review';
  end if;

  -- سالم: انتشار خودکار (همان کاری که دکمه‌ی «تأیید و انتشار» پنل می‌کند)
  pub_id := coalesce(nullif(ad ->> 'id', ''), 's' || p_id);
  insert into public.listings (id, data, status)
  values (pub_id, ad - 'id' - 'pending' - 'is_mine' - 'mine', 'published')
  on conflict (id) do update set data = excluded.data, status = 'published';
  update public.submissions
     set status = 'approved', published_id = pub_id, reviewed_at = now(), reviewed_by = 'bot', review_note = null
   where id = p_id;
  if coalesce(s.payload ->> 'owner_token', '') ~ '^[0-9a-f-]{36}$' then
    insert into public.listing_owners (listing_id, token) values (pub_id, (s.payload ->> 'owner_token')::uuid)
      on conflict (listing_id) do update set token = excluded.token;
    title := case when (ad ->> 'is_notice')::boolean is true then 'اطلاعیه‌ی درگذشت' else 'آگهی' end;
    insert into public.messages (title, body, kind, target_listing)
    values (title || ' «' || nm || '» منتشر شد',
            'آگهی شما به‌صورت خودکار بررسی و برای همه منتشر شد. از «آگهی‌های من» می‌توانید آن را ببینید.', 'admin', pub_id);
  end if;
  return 'approved';
end $$;
revoke all on function public.bot_review_submission(bigint) from public;

create or replace function public.bot_on_submission() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin
    perform public.bot_review_submission(new.id);
  exception when others then
    -- خطای ربات نباید ثبت آگهی را خراب کند؛ آگهی برای کارشناس می‌ماند
    update public.submissions set review_note = 'ربات نتوانست بررسی کند: ' || left(sqlerrm, 200), reviewed_by = 'bot' where id = new.id;
  end;
  return null;
end $$;
drop trigger if exists bot_on_submission on public.submissions;
create trigger bot_on_submission after insert on public.submissions
  for each row execute function public.bot_on_submission();

-- همدردی: پیش از ذخیره بررسی می‌شود؛ مشکوک‌ها پنهان می‌مانند تا کارشناس ببیند
create or replace function public.bot_on_condolence() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cfg public.bot_settings%rowtype;
  r   text[] := '{}';
  n   int;
begin
  select * into cfg from public.bot_settings where id = 1;
  if cfg.id is null or not cfg.enabled or not cfg.auto_condolences then return new; end if;
  r := public.bot_text_flags(new.name || ' ' || new.message, false);
  if new.message !~ '[آ-یa-zA-Z]' then r := r || 'متن بدون حروف'::text; end if;
  -- یک متن در ۱۰ دقیقه بیش از ۳ بار (اسپم)
  select count(*) into n from public.condolences
   where message = new.message and created_at > now() - interval '10 minutes';
  if n >= 3 then r := r || 'متن تکراری (اسپم)'::text; end if;
  -- همدردی‌های پشت‌سرهم با یک نام برای یک آگهی
  select count(*) into n from public.condolences
   where listing_id = new.listing_id and name = new.name and created_at > now() - interval '5 minutes';
  if n >= 2 then r := r || 'ارسال پشت‌سرهم'::text; end if;
  if array_length(r, 1) > 0 then
    new.status := 'hidden';
    new.review_note := array_to_string(r, ' · ');
  end if;
  return new;
end $$;
drop trigger if exists bot_on_condolence on public.condolences;
create trigger bot_on_condolence before insert on public.condolences
  for each row execute function public.bot_on_condolence();

-- ویرایش همدردی هم دوباره بررسی می‌شود
create or replace function public.bot_on_condolence_edit() returns trigger
language plpgsql security definer set search_path = public as $$
declare cfg public.bot_settings%rowtype; r text[];
begin
  if new.message is not distinct from old.message and new.name is not distinct from old.name then return new; end if;
  if public.is_admin() then return new; end if;
  select * into cfg from public.bot_settings where id = 1;
  if cfg.id is null or not cfg.enabled or not cfg.auto_condolences then return new; end if;
  r := public.bot_text_flags(new.name || ' ' || new.message, false);
  if array_length(r, 1) > 0 and new.status = 'published' then
    new.status := 'hidden';
    new.review_note := array_to_string(r, ' · ');
  end if;
  return new;
end $$;
drop trigger if exists bot_on_condolence_edit on public.condolences;
create trigger bot_on_condolence_edit before update on public.condolences
  for each row execute function public.bot_on_condolence_edit();
