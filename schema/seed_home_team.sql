-- ============================================================
-- HOME TEAM  •  Seed — Jessica & Naor's household
--
-- Run this AFTER:
--   1. schema.sql has been applied
--   2. Both users have signed up and gone through /onboarding/create
--      (Jessica creates the household, Naor joins via invite)
--   3. Profiles named "Jessica" and "Naor" exist in the same household
--
-- Uses name-based lookups so no UUIDs need to be hardcoded.
-- ============================================================

-- ── Helper: get Jessica's household id ───────────────────────
-- All inserts below use a subquery rather than a hardcoded UUID.

-- ── JESSICA'S TASKS ──────────────────────────────────────────

insert into tasks (household_id, owner_id, is_shared, icon, name, meta, freq, position)
select p.household_id, p.id, false, '🍽️', 'Meal Planning',
       'Weekly meals and grocery list', 'Daily', 1
from profiles p where lower(p.name) = 'jessica' limit 1;

insert into tasks (household_id, owner_id, is_shared, icon, name, meta, freq, position)
select p.household_id, p.id, false, '🏥', 'Doctor Appointments',
       'Scheduling, records, follow-ups', 'As needed', 2
from profiles p where lower(p.name) = 'jessica' limit 1;

insert into tasks (household_id, owner_id, is_shared, icon, name, meta, freq, position)
select p.household_id, p.id, false, '🏫', 'Daycare Coordination',
       'Pickups, communications, events', 'Weekly', 3
from profiles p where lower(p.name) = 'jessica' limit 1;

insert into tasks (household_id, owner_id, is_shared, icon, name, meta, freq, position)
select p.household_id, p.id, false, '📖', 'Bedtime Routine',
       'After bath - books, wind-down, settling', 'Nightly', 4
from profiles p where lower(p.name) = 'jessica' limit 1;

insert into tasks (household_id, owner_id, is_shared, icon, name, meta, freq, position)
select p.household_id, p.id, false, '👗', 'Kids Clothes',
       'Outfits, daycare bags, seasonal needs', 'Weekly', 5
from profiles p where lower(p.name) = 'jessica' limit 1;

-- ── NAOR'S TASKS ─────────────────────────────────────────────

insert into tasks (household_id, owner_id, is_shared, icon, name, meta, freq, position)
select p.household_id, p.id, false, '🗑️', 'Garbage and Recycling',
       'Already his - keep it up', 'Weekly', 1
from profiles p where lower(p.name) = 'naor' limit 1;

insert into tasks (household_id, owner_id, is_shared, icon, name, meta, freq, position)
select p.household_id, p.id, false, '🐾', 'Animals',
       'Feeding, water, care routine', 'Daily', 2
from profiles p where lower(p.name) = 'naor' limit 1;

insert into tasks (household_id, owner_id, is_shared, icon, name, meta, freq, position)
select p.household_id, p.id, false, '🛁', 'Bathtime Both Girls',
       'Naor runs it - Ellie and Ariyah', 'Nightly', 3
from profiles p where lower(p.name) = 'naor' limit 1;

insert into tasks (household_id, owner_id, is_shared, icon, name, meta, freq, position)
select p.household_id, p.id, false, '🌅', 'Saturday Morning',
       'Naor fully on - Jessica gets time off', 'Weekly', 4
from profiles p where lower(p.name) = 'naor' limit 1;

insert into tasks (household_id, owner_id, is_shared, icon, name, meta, freq, position)
select p.household_id, p.id, false, '🛒', 'Grocery Pickup',
       'Jessica builds the list, Naor executes', 'Weekly', 5
from profiles p where lower(p.name) = 'naor' limit 1;

-- ── TOGETHER TASKS ───────────────────────────────────────────

insert into tasks (household_id, owner_id, is_shared, icon, name, meta, freq, position)
select p.household_id, null, true, '🏊', 'Friday Swim Classes',
       'After daycare - Ellie and Ariyah', 'Weekly', 1
from profiles p where lower(p.name) = 'jessica' limit 1;

insert into tasks (household_id, owner_id, is_shared, icon, name, meta, freq, position)
select p.household_id, null, true, '🗓️', 'Saturday Check-in',
       'After girls bedtime - just you two', 'Weekly', 2
from profiles p where lower(p.name) = 'jessica' limit 1;

insert into tasks (household_id, owner_id, is_shared, icon, name, meta, freq, position)
select p.household_id, null, true, '💬', 'One-on-One Time',
       '30 min without phones - protect this', 'Weekly', 3
from profiles p where lower(p.name) = 'jessica' limit 1;

insert into tasks (household_id, owner_id, is_shared, icon, name, meta, freq, position)
select p.household_id, null, true, '🔄', 'Monthly Chart Review',
       'Is this still working for both of you?', 'Monthly', 4
from profiles p where lower(p.name) = 'jessica' limit 1;

-- ── SUBTASKS (by task name lookup) ───────────────────────────

-- Meal Planning
insert into subtasks (task_id, household_id, text, position)
select t.id, t.household_id, v.txt, v.pos
from tasks t, (values ('Plan weekly meals',1),('Write grocery list',2),('Check snacks and kids supplies',3)) v(txt,pos)
where t.name = 'Meal Planning';

-- Doctor Appointments
insert into subtasks (task_id, household_id, text, position)
select t.id, t.household_id, v.txt, v.pos
from tasks t, (values ('Pediatrician - Ellie',1),('Pediatrician - Ariyah',2),('Dentist appointments',3),('Vaccinations up to date',4)) v(txt,pos)
where t.name = 'Doctor Appointments';

-- Daycare Coordination
insert into subtasks (task_id, household_id, text, position)
select t.id, t.household_id, v.txt, v.pos
from tasks t, (values ('Friday pickup before 12:00',1),('Check daycare messages',2),('Prepare bags for next week',3)) v(txt,pos)
where t.name = 'Daycare Coordination';

-- Bedtime Routine
insert into subtasks (task_id, household_id, text, position)
select t.id, t.household_id, v.txt, v.pos
from tasks t, (values ('Books and stories',1),('Wind-down and cuddles',2),('Settle both girls to sleep',3)) v(txt,pos)
where t.name = 'Bedtime Routine';

-- Kids Clothes
insert into subtasks (task_id, household_id, text, position)
select t.id, t.household_id, v.txt, v.pos
from tasks t, (values ('Prep outfits for the week',1),('Pack swim bags for Friday',2),('Check sizes and replace as needed',3)) v(txt,pos)
where t.name = 'Kids Clothes';

-- Garbage and Recycling
insert into subtasks (task_id, household_id, text, position)
select t.id, t.household_id, v.txt, v.pos
from tasks t, (values ('Take out bins on collection day',1),('Separate recycling',2),('Bring bins back in',3)) v(txt,pos)
where t.name = 'Garbage and Recycling';

-- Animals
insert into subtasks (task_id, household_id, text, position)
select t.id, t.household_id, v.txt, v.pos
from tasks t, (values ('Morning feed',1),('Fresh water',2),('Evening feed',3),('Vet appointments',4),('Food and supplies check',5)) v(txt,pos)
where t.name = 'Animals';

-- Bathtime Both Girls
insert into subtasks (task_id, household_id, text, position)
select t.id, t.household_id, v.txt, v.pos
from tasks t, (values ('Run the bath',1),('Wash both girls',2),('Towel dry and get dressed',3)) v(txt,pos)
where t.name = 'Bathtime Both Girls';

-- Saturday Morning
insert into subtasks (task_id, household_id, text, position)
select t.id, t.household_id, v.txt, v.pos
from tasks t, (values ('Breakfast for girls',1),('Activity or outing - his call',2),('No check-ins with Jessica',3)) v(txt,pos)
where t.name = 'Saturday Morning';

-- Grocery Pickup
insert into subtasks (task_id, household_id, text, position)
select t.id, t.household_id, v.txt, v.pos
from tasks t, (values ('Check list from Jessica',1),('Pick up or order online',2),('Put groceries away',3)) v(txt,pos)
where t.name = 'Grocery Pickup';

-- Friday Swim Classes
insert into subtasks (task_id, household_id, text, position)
select t.id, t.household_id, v.txt, v.pos
from tasks t, (values ('Pickup from daycare before 12:00',1),('Lunch before swim',2),('Ellie swim at 13:30',3),('Ariyah swim at 14:15',4),('Swim bags packed',5)) v(txt,pos)
where t.name = 'Friday Swim Classes';

-- Saturday Check-in
insert into subtasks (task_id, household_id, text, position)
select t.id, t.household_id, v.txt, v.pos
from tasks t, (values ('What worked this week?',1),('What needs adjusting?',2),('Anything big next week?',3),('Phones away - just talk',4)) v(txt,pos)
where t.name = 'Saturday Check-in';

-- One-on-One Time
insert into subtasks (task_id, household_id, text, position)
select t.id, t.household_id, v.txt, v.pos
from tasks t, (values ('Phones in another room',1),('No house or kids talk - just you two',2)) v(txt,pos)
where t.name = 'One-on-One Time';

-- Monthly Chart Review
insert into subtasks (task_id, household_id, text, position)
select t.id, t.household_id, v.txt, v.pos
from tasks t, (values ('Review what is working',1),('Adjust tasks if needed',2),('Celebrate what went well',3)) v(txt,pos)
where t.name = 'Monthly Chart Review';
