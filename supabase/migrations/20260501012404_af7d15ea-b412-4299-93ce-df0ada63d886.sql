-- Lock down SECURITY DEFINER functions: revoke from public/anon, allow only authenticated users.
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

revoke all on function public.is_admin(uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated, service_role;

-- This one is only used by the auth.users trigger; revoke from API roles entirely.
revoke all on function public.grant_admin_if_allowlisted() from public, anon, authenticated;
grant execute on function public.grant_admin_if_allowlisted() to service_role;

-- Existing helper from earlier migrations: same treatment.
revoke all on function public.set_updated_at() from public, anon;
grant execute on function public.set_updated_at() to authenticated, service_role;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;
