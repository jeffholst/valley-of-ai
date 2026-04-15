# Leaderboard / High Score Feature — Implementation Checklist

Tracks all work required to ship per-game leaderboards with a `window.voaLeaderboard` hook.

---

## Phase 1 — Database

- [x] Create `supabase/migrations/20260415000000_leaderboard_scores.sql`
  - `leaderboard_scores` table: `id`, `app_id`, `player_name`, `score`, `created_at`
  - Indexes: `(app_id, score DESC)` and `(app_id, created_at DESC)`
  - RLS: enabled, public read policy, no public insert (service role writes only)
- [ ] Apply migration to Supabase project (`supabase db push` or manual SQL apply in dashboard)
- [ ] Verify table and RLS appear correctly in Supabase dashboard

---

## Phase 2 — API Route

- [x] Install `bad-words` npm package
- [x] Create `app/api/scores/profanity.js` — exports `isClean(name): boolean`
- [x] Create `app/api/scores/route.js`
  - `GET /api/scores?appId=YYYY/MM/DD/app-id` — returns top 10 scores (anon Supabase client)
  - `POST /api/scores` — validates Turnstile token, appId, playerName (profanity filter), score (maxScore check), inserts via service role client, returns updated top 10
  - Error handling: 503 for missing env, 400/422 for bad input, 500 for Supabase failure
- [x] Add `SUPABASE_SECRET_KEY` to `.env.example`
- [x] Add `createServiceClient()` to `lib/supabase.js`

---

## Phase 3 — app-shell.js Hook

- [x] Add `TURNSTILE_SITE_KEY_PLACEHOLDER = '__TURNSTILE_SITE_KEY__'` constant
- [x] Add `resolveTurnstileSiteKey()` resolver function
- [x] Add leaderboard CSS to `injectShellStyles()`:
  - `.voa-lb-backdrop` (full-screen overlay)
  - `.voa-lb-modal` (centered card, max-width 400px, mobile-safe)
  - `.voa-lb-input` (name field, 44px min-height)
  - `.voa-lb-table` (top-10 table, current player highlighted)
  - `.voa-lb-submit-btn` / `.voa-lb-cancel-btn` (large tap targets)
- [x] Build modal DOM in `injectShell()`:
  - Submit view: score display, name input, Turnstile div, Submit + Skip buttons
  - Board view: top-10 table, Close button
  - Turnstile `<script>` injected lazily on first open
- [x] Add `fetchTopScores(appId)` async function
- [x] Add `submitScore(appId, playerName, score, turnstileToken)` async function
- [x] Add `openLeaderboardSubmit(score, opts)` — pre-fills name from localStorage
- [x] Add `openLeaderboardBoard(appId)` — fetches + renders top 10
- [x] Expose `window.voaLeaderboard = { submit, show }` inside `injectShell()`
- [x] Add 🏆 header button that calls `window.voaLeaderboard.show()`
- [x] Update `apps/shared/shell-config.json` — add `"turnstileSiteKey": "__TURNSTILE_SITE_KEY__"`
- [x] Update `scripts/sync-public-content.js` — add `__TURNSTILE_SITE_KEY__` to `PLACEHOLDER_MAP`

---

## Phase 4 — `/leaderboard` Showcase Page

- [x] Create `app/leaderboard/page.jsx`
  - Server component using anon Supabase client
  - Load `data/apps.json`; fetch top-3 scores per game that has any scores
  - Responsive grid of game cards (name, thumbnail, top 3)
  - Wrapped in global LayoutShell (via `app/layout.jsx`)

---

## Phase 5 — Agent Prompts

- [x] Update `docs/agent-prompts/AGENT_PROMPT_SHARED.md`
  - Added `## Leaderboard Hook` section with `voaLeaderboard.submit()` guard pattern, `.show()`, `maxScore` guidance
- [x] Update `docs/agent-prompts/AGENT_PROMPT_NEW_APP.md`
  - GENERATE_HTML: games must call `window.voaLeaderboard?.submit(score)` at game-over
  - CREATE_META_JSON: set `maxScore` for all games
- [x] Update `docs/agent-prompts/AGENT_PROMPT_IMPROVEMENT.md`
  - MODIFY_HTML: added leaderboard as a valid improvement type

---

## Phase 6 — Documentation & README

- [x] Create `docs/LEADERBOARD_HOOK.md` — full implementation guide
- [x] Update `README.md`
  - Added `SUPABASE_SECRET_KEY` to env vars table
  - Added `maxScore` to meta.json schema section
  - Added `/leaderboard` section to routes list
  - Updated 3rd party services table (Supabase row)

---

## Phase 7 — Tests

- [x] Create `__tests__/api/scores.test.js`
  - GET: appId validation, top-10 response shape
  - POST: env guard (503), Turnstile validation, appId check, maxScore enforcement, profanity rejection (422), name format, score type, success path with top-10 return
- [x] Create `__tests__/api/scores-profanity.test.js`
  - `isClean()` returns true for clean names
  - `isClean()` returns false for known bad words

---

## Phase 8 — Verification

- [ ] `supabase db push` (or manual SQL) — confirm table visible in dashboard
- [ ] `window.voaLeaderboard.submit(42)` in DevTools — modal opens, name pre-filled, Turnstile renders, submit works, leaderboard shows
- [ ] 🏆 button in header shows leaderboard
- [ ] `/leaderboard` page renders game cards with scores
- [x] `npm run lint` — 0 errors, 0 warnings
- [x] `npm test` — all 292 tests pass
- [x] `npm run sync` — `public/apps/shared/shell-config.json` has `turnstileSiteKey` substituted
- [ ] Set `SUPABASE_SECRET_KEY` in Vercel environment variables
- [ ] Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in Vercel (already set if Turnstile is active)
