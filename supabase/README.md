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
