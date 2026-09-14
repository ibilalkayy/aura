-- Run this once, after you've signed up in the app, to make your own
-- account an admin. Replace the email with the one you signed up with.
-- Run again with a different email to make additional admins.

update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'you@example.com');
