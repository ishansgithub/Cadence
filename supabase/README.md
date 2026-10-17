# Database migrations

Apply these files, in order, to a fresh Supabase project:

1. `migrations/0001_init.sql` — tables, enums, indexes, `updated_at` trigger
2. `migrations/0002_rls.sql` — row level security so each user only sees their own rows
3. `migrations/0003_reports.sql` — report views (`security_invoker = true`, so RLS still applies)

Do not edit a migration after it has been applied. Add a new numbered file for later schema changes.

## Supabase CLI

From the repo root, with the [Supabase CLI](https://supabase.com/docs/guides/cli) installed and logged in:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

`db push` runs every file in `supabase/migrations` that the linked project has not applied yet, in filename order.

To check the SQL locally against a throwaway database instead:

```bash
supabase db reset
```

That needs the local stack (`supabase start`) and applies the same migration folder.

## SQL editor

In the Supabase dashboard, open **SQL Editor** and run each file’s full contents once, in the order above. Stop if a statement errors; later files depend on earlier ones.

## Row level security check

`rls-check.sql` signs in as two existing users, writes rows as the first, then asserts the second cannot read or write those rows in `goals`, `tasks`, `sessions`, `blocklists`, and `settings`. The script rolls back.

The SQL editor connects as `postgres`, and the table owner bypasses RLS. The script switches to `authenticated` and sets `request.jwt.claims`, which is what `auth.uid()` uses. Replace the two placeholder UUIDs with real `auth.users.id` values before you run it. No exception means the second user is blocked. An exception names the table that leaked.

You can also check from the app: sign in as user A and confirm Settings shows a time zone, sign out, sign in as user B, and in the SQL editor (as postgres) confirm B's `settings.user_id` is B and A's row is a different id. The script is the actual cross-read proof, because the app never lists another user's rows.
