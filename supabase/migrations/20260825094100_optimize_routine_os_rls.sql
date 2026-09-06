drop policy if exists "Users can select their daily records" on public.daily_records;
drop policy if exists "Users can insert their daily records" on public.daily_records;
drop policy if exists "Users can update their daily records" on public.daily_records;
drop policy if exists "Users can delete their daily records" on public.daily_records;

create policy "Users can select their daily records"
  on public.daily_records for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their daily records"
  on public.daily_records for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their daily records"
  on public.daily_records for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their daily records"
  on public.daily_records for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can select their settings" on public.user_settings;
drop policy if exists "Users can insert their settings" on public.user_settings;
drop policy if exists "Users can update their settings" on public.user_settings;
drop policy if exists "Users can delete their settings" on public.user_settings;

create policy "Users can select their settings"
  on public.user_settings for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert their settings"
  on public.user_settings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their settings"
  on public.user_settings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their settings"
  on public.user_settings for delete
  to authenticated
  using ((select auth.uid()) = user_id);
