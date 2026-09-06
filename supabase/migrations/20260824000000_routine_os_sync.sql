create table if not exists public.daily_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key date not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, date_key)
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists daily_records_user_updated_at_idx
  on public.daily_records (user_id, updated_at desc);

alter table public.daily_records enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists "Users can select their daily records" on public.daily_records;
drop policy if exists "Users can insert their daily records" on public.daily_records;
drop policy if exists "Users can update their daily records" on public.daily_records;
drop policy if exists "Users can delete their daily records" on public.daily_records;

create policy "Users can select their daily records"
  on public.daily_records for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their daily records"
  on public.daily_records for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their daily records"
  on public.daily_records for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their daily records"
  on public.daily_records for delete
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can select their settings" on public.user_settings;
drop policy if exists "Users can insert their settings" on public.user_settings;
drop policy if exists "Users can update their settings" on public.user_settings;
drop policy if exists "Users can delete their settings" on public.user_settings;

create policy "Users can select their settings"
  on public.user_settings for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their settings"
  on public.user_settings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their settings"
  on public.user_settings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their settings"
  on public.user_settings for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.daily_records to authenticated;
grant select, insert, update, delete on public.user_settings to authenticated;

