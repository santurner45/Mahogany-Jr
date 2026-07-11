-- Fan Wall schema for Mahogany Jr's site.
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).

create table if not exists wall_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  message text not null check (char_length(message) between 1 and 200),
  reply text check (char_length(reply) <= 200),
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

alter table wall_messages enable row level security;

-- Anyone can read every message (no moderation queue — posts are public instantly).
create policy "wall_messages_select_all"
  on wall_messages for select
  to anon, authenticated
  using (true);

-- Only Mahogany Jr (an authenticated user) can edit a message to add/update a reply.
create policy "wall_messages_update_authenticated"
  on wall_messages for update
  to authenticated
  using (true)
  with check (true);

-- Only Mahogany Jr can delete a message (spam/abuse cleanup).
create policy "wall_messages_delete_authenticated"
  on wall_messages for delete
  to authenticated
  using (true);

-- Public visitors insert through this function only, so they can never set
-- `reply`/`replied_at` themselves — only name + message.
create or replace function submit_wall_message(p_name text, p_message text)
returns wall_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  new_row wall_messages;
begin
  insert into wall_messages (name, message)
  values (trim(p_name), trim(p_message))
  returning * into new_row;

  return new_row;
end;
$$;

grant execute on function submit_wall_message(text, text) to anon, authenticated;

-- Enables realtime so new messages/replies appear on everyone's page instantly.
alter publication supabase_realtime add table wall_messages;

-- --------------------------------------------------------------------------
-- One-time manual steps (in the Supabase dashboard, not this SQL file):
-- 1. Authentication > Providers > Email: turn OFF "Allow new users to sign up".
-- 2. Authentication > Users > Add user: create Mahogany Jr's own login
--    (email + password) so only that account can sign in as admin.
-- --------------------------------------------------------------------------
