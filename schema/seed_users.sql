-- ============================================
-- HOME TEAM — Link users to household
-- Run this AFTER both Jessica and Naor have
-- signed up via the app (magic link email)
-- ============================================

-- Step 1: Find your user IDs
-- Go to Supabase Dashboard → Authentication → Users
-- Copy the UUID for each user and paste below

-- Step 2: Insert profiles
insert into profiles (id, household_id, name, color) values
  ('JESSICA_USER_UUID_HERE', '00000000-0000-0000-0000-000000000001', 'Jessica', '#D4845A'),
  ('NAOR_USER_UUID_HERE',    '00000000-0000-0000-0000-000000000001', 'Naor',    '#5A8FA3');

-- That's it — RLS takes over from here.
-- Both users now share the same household and can see each other's data.
