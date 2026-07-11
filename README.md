# Mahogany-Jr
Official showcase and links site for musician & content creator Mahogany Jr.

## Fan Wall setup (Supabase)

The Fan Wall posts publicly and instantly, with live updates and an inline
sign-in so Mahogany Jr can reply or delete messages right from the page. It
needs a free [Supabase](https://supabase.com) project:

1. Create a project at supabase.com.
2. Open the SQL Editor and run `supabase/schema.sql`.
3. In **Authentication > Providers > Email**, turn off "Allow new users to
   sign up."
4. In **Authentication > Users**, add one user manually — this is Mahogany
   Jr's own login for replying/deleting on the wall.
5. In **Project Settings > API**, copy the Project URL and the `anon`
   public key into `js/supabase-config.js`.

The anon key is safe to commit/expose — it only allows what the RLS
policies in `supabase/schema.sql` permit.
