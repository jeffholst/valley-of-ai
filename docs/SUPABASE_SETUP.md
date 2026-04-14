# Supabase Setup Guide

Supabase is used for two things: **app voting** (thumbs up/down on gallery cards) and
**versus voting** (pick-the-winner on model comparison pages).

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Choose a name, region, and database password
4. Wait ~2 minutes for the project to provision

---

## 2. Run the Schema

Open the **SQL Editor** in your Supabase dashboard (left sidebar) and run the migration file:

```
supabase/migrations/20260101000000_initial_schema.sql
```

Copy the file contents and paste them into a new query, then click **Run**. This creates:

| Table          | Purpose                                                 |
| -------------- | ------------------------------------------------------- |
| `votes`        | Thumbs-up / thumbs-down votes for gallery apps          |
| `versus_votes` | Pick-the-winner votes for model comparison competitions |

Both tables have Row Level Security enabled with public read + insert policies (anonymous
voting tracked client-side via localStorage).

---

## 3. Get Your API Keys

In your Supabase dashboard: **Settings → API**

| Key                   | Where to copy it                        |
| --------------------- | --------------------------------------- |
| **Project URL**       | `https://your-project-ref.supabase.co`  |
| **anon / public key** | The `anon` key under "Project API keys" |

> Use the `anon` key, **not** the `service_role` key — the anon key is safe to expose in the browser.

---

## 4. Add Keys to Your Environment

In `.env` (local dev):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

In **Vercel** (production): Settings → Environment Variables → add both keys.
See [Vercel Environment Setup](https://github.com/jeffholst/valley-of-ai/wiki/Vercel-Environment-Setup) for step-by-step instructions.

---

## 5. Verify It Works

Start the dev server and open the gallery. Click a thumbs-up on any app — the count
should increment. In Supabase, go to **Table Editor → votes** and confirm a row was inserted.

For versus voting, open any `/versus/<id>` page and cast a vote — check **Table Editor → versus_votes**.

---

## Notes

- **No auth required** — voting is anonymous. The app uses `localStorage` to prevent a single
  browser from voting twice; the database itself does not enforce per-user uniqueness.
- **No migrations tool needed** — the single SQL file can be re-run safely (uses `if not exists`).
- If you need to reset votes, truncate the tables: `truncate public.votes; truncate public.versus_votes;`
