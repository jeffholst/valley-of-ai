# Supabase Client Refactor

## Goal

Remove `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_URL` from the browser entirely.
All Supabase operations — reads and writes — go through Next.js API routes using the service role
key. No Supabase SDK in the client bundle; no direct browser-to-Supabase calls.

Secondary: rename the `votes` table to `app_votes` for clarity.

---

## Before / After

|                                          | Before                                                          | After                                             |
| ---------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| Browser touches Supabase                 | Yes — hooks call Supabase SDK directly                          | No — hooks call `/api/votes`, `/api/versus-votes` |
| Client bundle contains                   | Supabase SDK + anon key + project URL                           | Nothing Supabase-related                          |
| Write protection on `app_votes`          | RLS public insert policy (anyone can POST directly to Supabase) | API route only — no RLS insert policy needed      |
| Write protection on `versus_votes`       | RLS public insert policy                                        | API route only                                    |
| Write protection on `leaderboard_scores` | Already server-gated                                            | Unchanged                                         |
| Env vars in client bundle                | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | None                                              |
| Env vars server-only                     | `SUPABASE_SECRET_KEY`                                           | `SUPABASE_URL`, `SUPABASE_SECRET_KEY`             |

---

## Database Migration

New file: `supabase/migrations/20260415000001_rename_votes_remove_public_insert.sql`

```sql
-- Rename votes → app_votes
ALTER TABLE public.votes RENAME TO public.app_votes;
ALTER INDEX votes_app_id_idx RENAME TO app_votes_app_id_idx;

-- Drop old policies (named for the old table)
DROP POLICY "votes: public read"   ON public.app_votes;
DROP POLICY "votes: public insert" ON public.app_votes;

-- Public read stays — vote counts are public data
CREATE POLICY "app_votes: public read"
  ON public.app_votes FOR SELECT USING (true);
-- No insert policy — all writes go through the API route using service role (bypasses RLS)

-- Same for versus_votes — remove the public insert backdoor
DROP POLICY "versus_votes: public insert" ON public.versus_votes;
-- Keep the read policy as-is
```

---

## Environment Variables

| Variable                        | Change                                                             |
| ------------------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | → rename to `SUPABASE_URL` (server-only, drop NEXT*PUBLIC* prefix) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | → deleted                                                          |
| `SUPABASE_SECRET_KEY`           | unchanged                                                          |

Update `.env.example`:

```
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-service-role-key
```

---

## `lib/supabase.js` — deleted

Remove the file entirely. No anon client, no mock client. Every import of `@/lib/supabase` is
replaced as described below.

---

## `lib/supabaseAdmin.js` — new file

Single export: a per-request factory using the service role key. Updated to use `SUPABASE_URL`
(no longer `NEXT_PUBLIC_`).

```js
import { createClient } from '@supabase/supabase-js';

/**
 * Server-side only. Returns a Supabase client using the service role key,
 * which bypasses RLS. Use exclusively in API route handlers.
 * Never import this in components or hooks.
 * Returns null if env vars are missing (callers should return 503).
 */
export function createServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
```

---

## New API Routes

### `app/api/votes/route.js`

**`GET /api/votes?appId=X`** — returns vote counts for a single app (used by the app detail page).

Response: `{ votes: [{ vote_type, created_at }] }`

**`GET /api/votes?appIds=X,Y,Z`** — bulk vote counts for the gallery page (comma-separated).

Response: `{ votes: [{ app_id, vote_type, created_at }] }`

**`POST /api/votes`** — inserts a vote.

Body: `{ appId, voteType }` — `voteType` must be `"up"` or `"down"`, `appId` must match
`^\d{4}/\d{2}/\d{2}/[a-z0-9-]+$`. No Turnstile required (votes are low-friction; can be added
later). Returns `{ ok: true }` on success.

Both GET variants use `createServiceClient()`. The service role read is identical to what the
anon key + public read RLS policy produced — same data, different key.

### `app/api/versus-votes/route.js`

**`GET /api/versus-votes?versusId=X`** — returns vote counts for one competition.

Response: `{ votes: [{ voted_app_id }] }`

**`GET /api/versus-votes?versusIds=X,Y,Z`** — bulk for the versus listing page.

Response: `{ votes: [{ versus_id, voted_app_id }] }`

**`POST /api/versus-votes`** — inserts a versus vote.

Body: `{ versusId, votedAppId }` — both required strings. Returns `{ ok: true }` on success.

---

## Updated Hooks

### `hooks/useVotes.js`

Replace all `supabase.from(...)` calls with `fetch()` calls to the new API routes.

| Current Supabase call                                                       | Replacement                                  |
| --------------------------------------------------------------------------- | -------------------------------------------- |
| `.from('votes').select('vote_type').eq('app_id', appId)`                    | `GET /api/votes?appId={appId}`               |
| `.from('votes').select('app_id, vote_type, voted_at').in('app_id', appIds)` | `GET /api/votes?appIds={appIds.join(',')}`   |
| `.from('votes').insert({ app_id, vote_type })`                              | `POST /api/votes` with `{ appId, voteType }` |

Note: the existing hook queries a `voted_at` column that does not exist in the schema (`created_at`
is the actual column name). Fix this in the new API route — return `created_at` and update the
hook's `recentNet` calculation to use `created_at`.

Remove the `import { supabase } from '@/lib/supabase'` line entirely.

### `hooks/useVersusVotes.js`

| Current Supabase call                                                                | Replacement                                              |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| `.from('versus_votes').select('voted_app_id').eq('versus_id', versusId)`             | `GET /api/versus-votes?versusId={versusId}`              |
| `.from('versus_votes').select('versus_id, voted_app_id').in('versus_id', versusIds)` | `GET /api/versus-votes?versusIds={versusIds.join(',')}`  |
| `.from('versus_votes').insert({ versus_id, voted_app_id })`                          | `POST /api/versus-votes` with `{ versusId, votedAppId }` |

Remove the `import { supabase } from '@/lib/supabase'` line entirely.

---

## Updated Existing Files

### `app/api/scores/route.js`

```js
// Before:
import { supabase, createServiceClient } from '@/lib/supabase';

// After:
import { createServiceClient } from '@/lib/supabaseAdmin';
```

Remove the `supabase` import — the GET handler also switches to `createServiceClient()` for its
read. (Reads via service role return the same data as anon + public read RLS.)

### `app/leaderboard/page.jsx`

```js
// Before:
import { supabase } from '@/lib/supabase';

// After:
import { createServiceClient } from '@/lib/supabaseAdmin';
```

Replace `supabase.from(...)` with `createServiceClient()?.from(...)`. Handle `null` client (503
or empty state) the same way the API routes do.

### `README.md`

Update env vars table: remove `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
add `SUPABASE_URL`.

---

## Tests

### `__tests__/api/scores.test.js` — update mock

```js
// Before:
jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
  createServiceClient: jest.fn(),
}));
import { supabase, createServiceClient } from '@/lib/supabase';

// After:
jest.mock('@/lib/supabaseAdmin', () => ({ createServiceClient: jest.fn() }));
import { createServiceClient } from '@/lib/supabaseAdmin';
```

Update `beforeEach` / `afterEach` env var setup: `NEXT_PUBLIC_SUPABASE_URL` → `SUPABASE_URL`.

### New: `__tests__/api/votes.test.js`

Cover:

- `GET` missing `appId` and `appIds` → 400
- `GET` single app → 200 with vote array
- `GET` bulk → 200 with vote array
- `POST` valid `up` / `down` → 201
- `POST` invalid `voteType` → 400
- `POST` invalid `appId` format → 400
- 503 when `createServiceClient` returns null
- DB error → 500

### New: `__tests__/api/versus-votes.test.js`

Same shape as votes tests, adjusted for `versusId` / `votedAppId` fields.

---

## Files That Don't Change

| File                                                    | Why                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| `hooks/useVotes.js` shape                               | Internal logic unchanged — only Supabase calls become fetch calls |
| `hooks/useVersusVotes.js` shape                         | Same                                                              |
| `data/apps.json`, `scripts/`, `apps/`                   | No Supabase references                                            |
| `lib/turnstile.js`                                      | Unchanged                                                         |
| `supabase/migrations/20260101000000_initial_schema.sql` | Historical — do not edit; new migration handles the rename        |

---

## Verification

1. `npm run lint` — 0 errors, 0 warnings
2. `npm test` — all tests pass including new votes/versus-votes test files
3. `npm run build` — no build-time Supabase errors (no mock needed — server components handle null client gracefully)
4. In Supabase dashboard: confirm `app_votes` table exists, `votes: public insert` policy is gone, `versus_votes: public insert` policy is gone
5. In browser DevTools Network tab: confirm no requests go directly to `*.supabase.co` — all traffic routes through `/api/*`
6. Vote on an app and versus competition — optimistic updates still work, counts persist on reload
