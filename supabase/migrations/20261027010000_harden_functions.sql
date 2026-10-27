-- Trigger-only functions should not be callable through the REST API (/rpc).
-- Triggers still fire: EXECUTE is only checked when the trigger is created.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_profile_privileges() from public, anon, authenticated;
revoke execute on function public.guard_event_feature() from public, anon, authenticated;
revoke execute on function public.validate_registration() from public, anon, authenticated;
revoke execute on function public.guard_registration_update() from public, anon, authenticated;
revoke execute on function public.sync_seats_booked() from public, anon, authenticated;

alter function public.set_updated_at() set search_path = public;
