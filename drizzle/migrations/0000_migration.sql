create type public.app_role as enum ('admin', 'user');
create type public.report_status as enum ('reported', 'in_progress', 'resolved');
create type public.report_category as enum ('pothole', 'streetlight', 'garbage', 'water', 'other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Profiles readable by signed-in users" on public.profiles for select to authenticated using (true);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 1 and 2000),
  category report_category not null,
  status report_status not null default 'reported',
  photo_url text,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  upvote_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.reports to anon;
grant select, insert, update, delete on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "Reports are public" on public.reports for select to anon, authenticated using (true);
create policy "Users create own reports" on public.reports for insert to authenticated
  with check (auth.uid() = user_id and status = 'reported' and upvote_count = 0);
create policy "Admins update reports" on public.reports for update to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "Owners or admins delete reports" on public.reports for delete to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create table public.upvotes (
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);
grant select on public.upvotes to anon;
grant select, insert, delete on public.upvotes to authenticated;
grant all on public.upvotes to service_role;
alter table public.upvotes enable row level security;
create policy "Upvotes are public" on public.upvotes for select to anon, authenticated using (true);
create policy "Users upvote as themselves" on public.upvotes for insert to authenticated with check (auth.uid() = user_id);
create policy "Users remove own upvote" on public.upvotes for delete to authenticated using (auth.uid() = user_id);

create or replace function public.sync_upvote_count()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.reports set upvote_count = upvote_count + 1 where id = new.report_id;
  else
    update public.reports set upvote_count = greatest(upvote_count - 1, 0) where id = old.report_id;
  end if;
  return null;
end; $$;
create trigger upvotes_count after insert or delete on public.upvotes
for each row execute function public.sync_upvote_count();

create table public.status_updates (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  admin_id uuid not null,
  status report_status not null,
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);
grant select on public.status_updates to anon;
grant select, insert on public.status_updates to authenticated;
grant all on public.status_updates to service_role;
alter table public.status_updates enable row level security;
create policy "Status updates are public" on public.status_updates for select to anon, authenticated using (true);
create policy "Admins add status updates" on public.status_updates for insert to authenticated
  with check (auth.uid() = admin_id and public.has_role(auth.uid(), 'admin'));

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;
create trigger reports_touch before update on public.reports
for each row execute function public.touch_updated_at();