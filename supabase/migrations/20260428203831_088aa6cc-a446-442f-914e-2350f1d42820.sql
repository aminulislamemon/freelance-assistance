
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  theme text not null default 'dark',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- Projects
create type public.project_status as enum ('pending','in_progress','completed');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  client_name text,
  price numeric(12,2) not null default 0,
  deadline timestamptz,
  status public.project_status not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;
create index on public.projects (user_id);

create policy "Users view own projects" on public.projects for select using (auth.uid() = user_id);
create policy "Users insert own projects" on public.projects for insert with check (auth.uid() = user_id);
create policy "Users update own projects" on public.projects for update using (auth.uid() = user_id);
create policy "Users delete own projects" on public.projects for delete using (auth.uid() = user_id);

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
create index on public.tasks (project_id);

create policy "Users view own tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users insert own tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users update own tasks" on public.tasks for update using (auth.uid() = user_id);
create policy "Users delete own tasks" on public.tasks for delete using (auth.uid() = user_id);

-- Meetings
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  client_name text,
  starts_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.meetings enable row level security;
create index on public.meetings (user_id, starts_at);

create policy "Users view own meetings" on public.meetings for select using (auth.uid() = user_id);
create policy "Users insert own meetings" on public.meetings for insert with check (auth.uid() = user_id);
create policy "Users update own meetings" on public.meetings for update using (auth.uid() = user_id);
create policy "Users delete own meetings" on public.meetings for delete using (auth.uid() = user_id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_projects_updated before update on public.projects
  for each row execute function public.set_updated_at();
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
