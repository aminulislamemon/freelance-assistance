-- ============ ENUMS ============
do $$ begin
  create type public.app_role as enum ('admin', 'user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_status as enum ('new', 'negotiating', 'won', 'lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_source as enum ('fiverr', 'upwork', 'direct', 'referral', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.deal_status as enum ('open', 'won', 'lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.platform as enum ('fiverr', 'upwork', 'direct', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.meeting_type as enum ('lead', 'project', 'general');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.feedback_type as enum ('bug', 'feature', 'general');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.feedback_status as enum ('new', 'reviewed', 'planned', 'completed');
exception when duplicate_object then null; end $$;

-- Extend project_status to include 'cancelled' and 'active' (idempotent)
do $$ begin
  alter type public.project_status add value if not exists 'active';
exception when others then null; end $$;
do $$ begin
  alter type public.project_status add value if not exists 'cancelled';
exception when others then null; end $$;

-- ============ ADMIN ALLOWLIST + ROLES ============
create table if not exists public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);
alter table public.admin_emails enable row level security;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- security definer role check (no recursion)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  );
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    exists (select 1 from public.user_roles where user_id = _user_id and role = 'admin')
    or exists (
      select 1 from auth.users u
      join public.admin_emails a on lower(a.email) = lower(u.email)
      where u.id = _user_id
    );
$$;

-- ============ EXISTING TABLE EXTENSIONS ============
alter table public.profiles
  add column if not exists last_active_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists projects_count integer not null default 0,
  add column if not exists meetings_count integer not null default 0,
  add column if not exists leads_count integer not null default 0,
  add column if not exists ai_uses_count integer not null default 0;

alter table public.projects
  add column if not exists lead_id uuid,
  add column if not exists deal_id uuid,
  add column if not exists platform public.platform not null default 'direct';

alter table public.meetings
  add column if not exists meeting_type public.meeting_type not null default 'general',
  add column if not exists lead_id uuid,
  add column if not exists project_id uuid;

-- ============ LEADS ============
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  client_name text not null,
  source public.lead_source not null default 'direct',
  status public.lead_status not null default 'new',
  notes text,
  estimated_value numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.leads enable row level security;

drop policy if exists "Users view own leads" on public.leads;
create policy "Users view own leads" on public.leads for select using (auth.uid() = user_id);
drop policy if exists "Users insert own leads" on public.leads;
create policy "Users insert own leads" on public.leads for insert with check (auth.uid() = user_id);
drop policy if exists "Users update own leads" on public.leads;
create policy "Users update own leads" on public.leads for update using (auth.uid() = user_id);
drop policy if exists "Users delete own leads" on public.leads;
create policy "Users delete own leads" on public.leads for delete using (auth.uid() = user_id);

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

-- ============ DEALS ============
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lead_id uuid references public.leads(id) on delete set null,
  client_name text,
  agreed_price numeric not null default 0,
  platform public.platform not null default 'direct',
  scope text,
  status public.deal_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.deals enable row level security;

drop policy if exists "Users view own deals" on public.deals;
create policy "Users view own deals" on public.deals for select using (auth.uid() = user_id);
drop policy if exists "Users insert own deals" on public.deals;
create policy "Users insert own deals" on public.deals for insert with check (auth.uid() = user_id);
drop policy if exists "Users update own deals" on public.deals;
create policy "Users update own deals" on public.deals for update using (auth.uid() = user_id);
drop policy if exists "Users delete own deals" on public.deals;
create policy "Users delete own deals" on public.deals for delete using (auth.uid() = user_id);

drop trigger if exists set_deals_updated_at on public.deals;
create trigger set_deals_updated_at before update on public.deals
  for each row execute function public.set_updated_at();

-- FK constraints from projects/meetings to leads/deals (after leads/deals exist)
do $$ begin
  alter table public.projects
    add constraint projects_lead_id_fkey foreign key (lead_id) references public.leads(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.projects
    add constraint projects_deal_id_fkey foreign key (deal_id) references public.deals(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.meetings
    add constraint meetings_lead_id_fkey foreign key (lead_id) references public.leads(id) on delete set null;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.meetings
    add constraint meetings_project_id_fkey foreign key (project_id) references public.projects(id) on delete set null;
exception when duplicate_object then null; end $$;

-- ============ FEEDBACK ============
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  rating integer not null check (rating between 1 and 5),
  message text not null,
  feedback_type public.feedback_type not null default 'general',
  admin_status public.feedback_status not null default 'new',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.feedback enable row level security;

drop policy if exists "Users view own feedback" on public.feedback;
create policy "Users view own feedback" on public.feedback for select using (auth.uid() = user_id);
drop policy if exists "Users insert own feedback" on public.feedback;
create policy "Users insert own feedback" on public.feedback for insert with check (auth.uid() = user_id);
drop policy if exists "Admins view all feedback" on public.feedback;
create policy "Admins view all feedback" on public.feedback for select using (public.is_admin(auth.uid()));
drop policy if exists "Admins update feedback" on public.feedback;
create policy "Admins update feedback" on public.feedback for update using (public.is_admin(auth.uid()));

drop trigger if exists set_feedback_updated_at on public.feedback;
create trigger set_feedback_updated_at before update on public.feedback
  for each row execute function public.set_updated_at();

-- ============ USER EVENTS ============
create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_type text not null,
  page text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.user_events enable row level security;
create index if not exists user_events_user_id_created_idx on public.user_events(user_id, created_at desc);
create index if not exists user_events_event_type_idx on public.user_events(event_type);

drop policy if exists "Users insert own events" on public.user_events;
create policy "Users insert own events" on public.user_events for insert with check (auth.uid() = user_id);
drop policy if exists "Users view own events" on public.user_events;
create policy "Users view own events" on public.user_events for select using (auth.uid() = user_id);
drop policy if exists "Admins view all events" on public.user_events;
create policy "Admins view all events" on public.user_events for select using (public.is_admin(auth.uid()));

-- ============ ADMIN POLICIES ============
-- admin_emails: any signed-in user can read (to check their own status); only admins can mutate via SQL/admin UI
drop policy if exists "Auth users read admin_emails" on public.admin_emails;
create policy "Auth users read admin_emails" on public.admin_emails for select using (auth.uid() is not null);
drop policy if exists "Admins manage admin_emails" on public.admin_emails;
create policy "Admins manage admin_emails" on public.admin_emails for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- user_roles policies
drop policy if exists "Users view own roles" on public.user_roles;
create policy "Users view own roles" on public.user_roles for select using (auth.uid() = user_id);
drop policy if exists "Admins view all roles" on public.user_roles;
create policy "Admins view all roles" on public.user_roles for select using (public.is_admin(auth.uid()));
drop policy if exists "Admins manage roles" on public.user_roles;
create policy "Admins manage roles" on public.user_roles for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Admins can view all profiles (in addition to existing own-profile policy)
drop policy if exists "Admins view all profiles" on public.profiles;
create policy "Admins view all profiles" on public.profiles for select using (public.is_admin(auth.uid()));
drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles" on public.profiles for update using (public.is_admin(auth.uid()));

-- ============ AUTO-GRANT ADMIN ROLE FROM ALLOWLIST ============
create or replace function public.grant_admin_if_allowlisted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is not null and exists (
    select 1 from public.admin_emails where lower(email) = lower(new.email)
  ) then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict do nothing;
  end if;
  -- always ensure user role
  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_role on auth.users;
create trigger on_auth_user_created_role
  after insert on auth.users
  for each row execute function public.grant_admin_if_allowlisted();

-- ============ SEED ADMIN ALLOWLIST ============
insert into public.admin_emails (email) values ('aminulislamemon0005@gmail.com')
  on conflict (email) do nothing;

-- Grant admin role to any existing user whose email is on the allowlist
insert into public.user_roles (user_id, role)
select u.id, 'admin'::public.app_role
from auth.users u
join public.admin_emails a on lower(a.email) = lower(u.email)
on conflict do nothing;

-- Ensure all existing users have at least the 'user' role
insert into public.user_roles (user_id, role)
select u.id, 'user'::public.app_role from auth.users u
on conflict do nothing;

-- ============ AUTO-CREATE DEAL FOR EXISTING PROJECTS ============
with new_deals as (
  insert into public.deals (user_id, client_name, agreed_price, platform, scope, status)
  select p.user_id, p.client_name, p.price, 'direct'::public.platform, p.title,
    case when p.status = 'completed' then 'won'::public.deal_status else 'open'::public.deal_status end
  from public.projects p
  where p.deal_id is null
  returning id, user_id, client_name, agreed_price
)
update public.projects p
set deal_id = d.id
from public.deals d
where p.deal_id is null
  and p.user_id = d.user_id
  and coalesce(p.client_name,'') = coalesce(d.client_name,'')
  and p.price = d.agreed_price;
