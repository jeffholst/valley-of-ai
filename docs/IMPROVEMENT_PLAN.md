# Valley of AI — Technical Improvement Plan

> Generated from the March 2026 project audit. Work through these items sequentially or by priority.
> Each item is self-contained: reference it when asking Claude Code to implement that specific fix.

---

## How to use this plan

Tell Claude Code: _"Implement item H-1 from docs/IMPROVEMENT_PLAN.md"_ (or any item ID).
Each item has enough context to be actioned without re-reading the audit.

---

## HIGH Priority

### H-1 — Add tests and linting to CI pipeline

**File:** `.github/workflows/deploy.yml`

**Problem:** The CI workflow only runs `npm ci`, `npm run generate:apps`, and `npm run build`. Tests, lint, and validation are never run automatically. Code can be merged with failing tests or lint errors.

**What to do:**
- Add a job (or steps) that run before the build: `npm run lint`, `npm test`, `npm run validate:apps`
- The lint and test jobs should run on every `push` and `pull_request` event, not just pushes to `main`
- Consider splitting into two jobs: `quality` (lint + test + validate) and `build` (generate + build), with `build` depending on `quality`
- The `validate:apps` script checks HTML contracts, metadata schema, and registry sync — make it a hard gate

**Acceptance criteria:**
- A PR with a lint error or failing test is blocked from merging
- The workflow runs on both `push` to `main` and `pull_request` targeting `main`

---

### H-2 — Fix path traversal vulnerability in app-log API

**File:** `app/api/app-log/route.js`

**Problem:** The `appId` query parameter is used directly in `path.join(process.cwd(), 'public', 'apps', appId, 'log.jsonl')` without validation. A crafted `appId` like `../../etc/passwd` could read arbitrary files. The fallback directory traversal at lines 29–75 also uses unvalidated user input.

**What to do:**
- Before using `appId` in any path, validate it matches the pattern `^\d{4}/\d{2}/\d{2}/[a-z0-9-]+$`
- Return a 400 error immediately if validation fails
- After constructing the resolved path with `path.resolve()`, assert it starts with the expected base directory (`process.cwd() + '/public/apps/'`) as a defense-in-depth check
- Apply the same validation to any other path constructed from `appId`

**Acceptance criteria:**
- Requests with `appId=../../etc/passwd` return 400, not file contents
- Valid `appId` values like `2026/03/24/charades-chaos-deck` still work correctly

---

### H-3 — Break up the homepage monolith

**File:** `app/page.jsx` (currently ~773 lines)

**Problem:** The homepage mixes pterodactyl animation state management, Web Audio API brown noise generation, weather effects, filtering/sorting/pagination, and the full gallery UI in a single file. Any change to one concern risks breaking others.

**What to do — extract these pieces:**

1. **`hooks/usePterodactyls.js`** — all pterodactyl state, spawn logic, and animation frame management
2. **`hooks/useAmbientSound.js`** — Web Audio API brown noise: AudioContext creation, gain nodes, start/stop
3. **`hooks/useWeatherEffects.js`** (optional, low complexity) — or just leave CSS-only weather in place
4. **`components/GalleryFilters.jsx`** — the search input, category filter tabs, sort dropdown, and their handlers
5. **`components/GalleryPagination.jsx`** — page controls, items-per-page selector
6. **`components/GalleryGrid.jsx`** — the grid of `AppCard` components with empty-state handling

The remaining `app/page.jsx` should orchestrate these pieces and hold minimal state (just the top-level options and pagination cursor).

**Acceptance criteria:**
- `app/page.jsx` is under 200 lines
- No behavior change — all features work identically
- All extracted hooks/components are co-located in their respective directories

---

### H-4 — Add tests for API routes

**Files:** `app/api/suggestions/route.js`, `app/api/improvements/route.js`, `app/api/stripe/checkout/route.js`, `app/api/stripe/webhook/route.js`, `app/api/verify-payment/route.js`, `app/api/app-log/route.js`

**Problem:** Zero tests exist for any API route, including routes that handle money (Stripe) and external GitHub API calls.

**What to do:**
- Create `__tests__/api/` directory
- For each route, write tests using `jest` with mocked dependencies:
  - `suggestions/route.test.js` — test Turnstile failure, missing fields, valid submission (mock GitHub API call), length validation
  - `improvements/route.test.js` — same pattern as suggestions; also test `escapeMd()`
  - `app-log/route.test.js` — test path traversal rejection (H-2), valid `appId`, missing file 404
  - `stripe/checkout/route.test.js` — test missing `appId`, Stripe error handling, successful session creation (mock Stripe SDK)
  - `stripe/webhook/route.test.js` — test invalid signature rejection, valid `checkout.session.completed` event, Supabase update (mock both)
  - `verify-payment/route.test.js` — test missing session ID, Stripe session not found, successful verification
- Use `jest.mock()` for `@octokit/rest`, `stripe`, and `@supabase/supabase-js`

**Acceptance criteria:**
- Each route has at least 3 tests covering: happy path, missing/invalid input, and one external-service-failure case
- `npm test` passes with new tests included

---

### H-5 — Eliminate redundant per-card Supabase queries

**File:** `hooks/useVotes.js`

**Problem:** `useVotes` is called per `AppCard` — each instance fetches all vote rows for that specific app from Supabase. `useAllVoteCounts` already fetches votes for all visible apps in bulk. The per-card queries are redundant, resulting in N+1 queries on page load (one bulk + one per visible card).

**What to do:**
- Refactor so `AppCard` receives its vote counts as props from the parent gallery component
- The parent uses `useAllVoteCounts` (the single bulk hook) to get counts for all visible apps, then passes `{ upvotes, downvotes, userVote }` down to each `AppCard`
- The per-card `useVotes` hook should only be used in contexts where a single app is displayed in isolation (e.g., the showcase page)
- Alternatively: expose a `getCountsForApp(appId)` selector from `useAllVoteCounts` that the gallery parent calls, eliminating per-card network calls entirely

**Acceptance criteria:**
- Opening the homepage makes exactly 1 Supabase query for votes (the bulk query), not 1 + N
- Voting still works: optimistic updates, persistence, dedup

---

## MEDIUM Priority

### M-1 — Extract shared `verifyTurnstile()` utility

**Files:** `app/api/suggestions/route.js:4-29`, `app/api/improvements/route.js:12-37`

**Problem:** Both routes define an identical `verifyTurnstile()` function. Any change (e.g., error message, timeout, endpoint URL) must be made in two places.

**What to do:**
- Create `lib/turnstile.js` with a single exported `verifyTurnstile(token)` function
- Replace both inline definitions with `import { verifyTurnstile } from '@/lib/turnstile'`
- The function should throw (or return `{ success: false, error }`) on failure so callers can handle it uniformly

**Acceptance criteria:**
- `verifyTurnstile` exists only in `lib/turnstile.js`
- Both API routes import it from there
- Behavior is identical to before

---

### M-2 — Extract shared `formatDuration()` utility

**Files:** `components/AppLog.jsx:9-17`, `app/logs/page.jsx:37-48`

**Problem:** Two slightly different implementations of the same function exist. The `logs/page.jsx` version handles minutes; `AppLog.jsx` does not.

**What to do:**
- Create `lib/formatDuration.js` (or add to an existing `lib/utils.js` if one exists) with a single exported `formatDuration(ms)` that handles both ms and minute ranges
- Replace both inline definitions with an import
- Add a unit test in `__tests__/lib/formatDuration.test.js` covering: sub-second, seconds, minutes, null/undefined input

**Acceptance criteria:**
- `formatDuration` defined in exactly one place
- Unit tests pass

---

### M-3 — Add focus trapping to modals

**Files:** `components/DonateModal.jsx`, `components/SubmissionSuccessModal.jsx`, `components/PaymentSuccessModal.jsx`

**Problem:** Keyboard users can Tab out of open modals into background content. This is a WCAG 2.1 Level A failure.

**What to do:**
- Install `focus-trap-react` (or implement a lightweight `useFocusTrap` hook using `document.querySelectorAll` for focusable elements)
- Wrap each modal's content with the focus trap
- When a modal opens, focus should move to the first interactive element inside it
- When a modal closes, focus should return to the element that triggered the modal open
- Verify Escape key still closes all modals

**Acceptance criteria:**
- Tabbing inside an open modal cycles only through elements within the modal
- Focus returns to the trigger element on close
- No regressions in Escape-key-to-close behavior

---

### M-4 — Enable `jsx-a11y` ESLint rules

**File:** `eslint.config.js`

**Problem:** `eslint-plugin-jsx-a11y` is installed and registered but zero rules are active. The plugin has no effect.

**What to do:**
- Add `...jsxA11y.configs.recommended.rules` (or the flat-config equivalent) to the `rules` object in `eslint.config.js`
- Run `npm run lint` and fix any violations surfaced by the newly active rules
- Common fixes likely needed: `alt` text on `AppCard` thumbnails (see M-6), ARIA role corrections, button vs. anchor misuse

**Acceptance criteria:**
- `jsx-a11y/recommended` rules are active and enforced at the lint level
- `npm run lint` passes with 0 warnings after fixing violations

---

### M-5 — Add `prefers-reduced-motion` support to animations

**File:** `styles/globals.css`

**Problem:** Only 3 animations respect `prefers-reduced-motion`. Pterodactyls, weather effects (rain, snow, lightning), shooting stars, gradient text, earthquake effect, and others do not. Users with vestibular disorders can be affected.

**What to do:**
- Add a `@media (prefers-reduced-motion: reduce)` block at the bottom of `globals.css`
- Inside it, disable or significantly tone down:
  - Pterodactyl flight animations (`.pterodactyl`)
  - Weather particles (`.rain-particle`, `.snow-particle`, `.lightning-flash`)
  - Shooting stars (`.shooting-star`)
  - Gradient text animation
  - Earthquake effect (`.earthquake-cards .card`)
  - Any other `animation` or `transition` rules not already covered
- The simplest safe approach: `*, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }` inside the media query, then selectively re-enable non-motion animations (color changes, opacity fades) as needed

**Acceptance criteria:**
- Enabling "Reduce motion" in macOS Accessibility settings stops all motion animations on the gallery page
- Non-motion effects (color, opacity) can remain

---

### M-6 — Fix vacuous test assertions and wrong field names in existing tests

**Files:** `__tests__/data/apps.test.js`, `__tests__/components/ThemeToggle.test.js`

**Problem:**
1. `apps.test.js:44` checks for `description` and `path` but the registry uses `shortDescription` and `appPath` — tests pass trivially without actually verifying anything meaningful
2. `ThemeToggle.test.js` "changes theme when clicked" test only asserts `expect(button).toBeInTheDocument()` after clicking — this proves nothing about theme switching

**What to do:**
1. In `apps.test.js`: fix field names to match the actual registry schema (`id`, `name`, `shortDescription`, `appPath`, `category`, `status`, `thumbnail`, `homepagePath`). Also verify `createdAt` is a valid ISO 8601 date string for each app.
2. In `ThemeToggle.test.js`: after clicking the toggle, assert that `document.documentElement.getAttribute('data-theme')` has changed to the expected value (or that the relevant class/attribute was toggled)

**Acceptance criteria:**
- `apps.test.js` would fail if a required field were removed from an entry in `data/apps.json`
- `ThemeToggle.test.js` would fail if `data-theme` toggling was broken

---

### M-7 — Add server-side Markdown escaping to suggestions route

**File:** `app/api/suggestions/route.js:68`

**Problem:** The `description` field is interpolated directly into the GitHub issue body without escaping. The improvements route has `escapeMd()` but suggestions does not. A user could inject Markdown formatting into issues.

**What to do:**
- Move the `escapeMd()` function from `app/api/improvements/route.js` to `lib/markdown.js` (or include in the Turnstile utility from M-1)
- Import and apply it in `app/api/suggestions/route.js` to all user-supplied fields written into the issue body
- Add a unit test for `escapeMd()` covering backticks, brackets, asterisks, underscores

**Acceptance criteria:**
- `escapeMd` lives in one shared location
- Both routes import it
- `app/api/suggestions/route.js` applies it to all user-supplied content in the issue body

---

### M-8 — Add server-side vote deduplication

**File:** `hooks/useVotes.js`, Supabase schema

**Problem:** Vote deduplication relies entirely on `localStorage`. Clearing storage or using a different browser allows unlimited voting per user.

**What to do:**
- Add a unique constraint on the `votes` table: `(app_id, voter_fingerprint)` or use IP + user-agent hashing
- Alternatively, leverage Supabase Row Level Security with a per-session or per-IP policy
- In the API route or Supabase function, use `upsert` with `onConflict` to prevent duplicate rows rather than relying on the client to check first
- Keep `localStorage` as the fast-path client-side check (avoids roundtrips for already-voted apps), but make the server the authoritative dedup layer

**Acceptance criteria:**
- A user who clears `localStorage` and revisits cannot vote a second time on the same app
- The Supabase table enforces uniqueness at the database level

---

### M-9 — Fix `npm run format` to include all source directories

**File:** `package.json`

**Problem:** The format script only covers `app/`, `components/`, `hooks/`, `lib/`. It excludes `scripts/` and `__tests__/`, which may have inconsistent formatting.

**What to do:**
- Update the `format` script to include `scripts/` and `__tests__/`
- Run `npm run format` after the change to reformat any inconsistent files
- Commit any reformatted files

**Acceptance criteria:**
- `npm run format` and `npm run lint` cover the same set of directories
- `scripts/` and `__tests__/` are included in both

---

## LOW Priority

### L-1 — Add TypeScript (incremental migration)

**Problem:** No type safety across the codebase. The data shapes for apps registry, log entries, pipeline steps, and vote counts are complex and undocumented in code.

**What to do (incremental — do not rewrite everything at once):**
1. Add `tsconfig.json` with `"allowJs": true` and `"checkJs": false` to allow gradual migration
2. Start with the most value-dense files: `lib/`, `scripts/selection-utils.js`, `hooks/useVotes.js`
3. Create `types/` directory with:
   - `types/app.ts` — `AppMeta`, `AppImprovement`, `GenerationInfo` interfaces from `meta.json` schema
   - `types/log.ts` — `LogEntry`, `TransactionLog` types
   - `types/votes.ts` — `VoteType`, `VoteCounts`, `VoteState` types
4. Migrate files to `.ts`/`.tsx` one at a time; Next.js supports mixed JS/TS projects

**Acceptance criteria:**
- `tsconfig.json` exists and `tsc --noEmit` passes
- At minimum, `lib/` and `types/` are fully typed

---

### L-2 — Clean up legacy docs

**Directory:** `docs/agent-prompts/`

**Problem:** Several files with unclear current status: `AGENT_PROMPT_LEGACY.md`, `AGENT_PROMPT_ULTRA_COMPACT.md`, `prompt.md`, `single_prompt.md`, `specs.md`, `notes.md`.

**What to do:**
- Review each file and determine: active, archived, or deletable
- Move archived files to `docs/agent-prompts/archive/` with a short `README.md` explaining they are historical
- Delete files that add no value
- Update any cross-references in `CLAUDE.md` or other docs if files move

**Acceptance criteria:**
- `docs/agent-prompts/` contains only the three active prompt files plus an optional `archive/` folder
- No dangling references in `CLAUDE.md`

---

### L-3 — Add a pre-commit hook with lint-staged

**Problem:** No automated quality gate before commits. Developers must remember to run lint/format manually.

**What to do:**
- Install `husky` and `lint-staged` as devDependencies
- Configure `lint-staged` in `package.json` to run on staged files:
  - `*.{js,jsx,mjs}`: `eslint --fix` then `prettier --write`
  - `*.{css,json,md}`: `prettier --write`
- Initialize Husky: `npx husky init` and add a `pre-commit` hook that runs `npx lint-staged`
- Ensure the hook does not block the AI pipeline agent commits (the pipeline stages files explicitly)

**Acceptance criteria:**
- `git commit` on a file with a lint error is blocked and the error is shown
- Auto-fixable issues are fixed and re-staged automatically before the commit completes

---

### L-4 — Add a responsive header nav menu

**File:** `components/Header.jsx`

**Problem:** Navigation links are displayed in a horizontal row with no responsive menu for narrow viewports. On mobile, links may overflow or wrap unexpectedly.

**What to do:**
- Add a hamburger button (`☰`) that appears on viewports below `sm` breakpoint
- Toggle a mobile menu that shows nav links stacked vertically
- Close the menu on outside click, Escape key, and navigation
- Ensure the toggle button has `aria-label="Open menu"` / `"Close menu"` and `aria-expanded`

**Acceptance criteria:**
- On a 375px viewport, a hamburger icon replaces the inline nav
- The menu is keyboard-navigable and closable with Escape

---

### L-5 — Standardize script file extensions

**Directory:** `scripts/`

**Problem:** Some scripts use `.mjs`, others `.js`. Since `"type": "module"` is set in `package.json`, all `.js` files are already ESM — the `.mjs` extension is redundant and inconsistent.

**What to do:**
- Rename all `.mjs` files in `scripts/` to `.js`
- Update any references in `package.json` scripts, `CLAUDE.md`, and import statements

**Acceptance criteria:**
- All files in `scripts/` use `.js` extension
- All `npm run *` commands still work

---

### L-6 — Add `application-name` meta tag to agent prompt templates

**File:** `docs/agent-prompts/AGENT_PROMPT_SHARED.md`

**Problem:** `getAppName()` in `app-shell.js` falls back to `document.title` (now fixed), but apps where the title pattern is ambiguous or non-standard may still produce wrong names in the improve-page link. Adding an explicit `<meta name="application-name">` is the most reliable signal.

**What to do:**
- Add `<meta name="application-name" content="App Name">` to the required head tags template in `AGENT_PROMPT_SHARED.md` and `CLAUDE.md`
- Instruct agents to replace `App Name` with the actual app name (same value used in `<title>` before the ` - __MAIN_SITE_NAME__` suffix)
- This tag is already the first-priority check in `getAppName()`

**Acceptance criteria:**
- Both `AGENT_PROMPT_SHARED.md` and `CLAUDE.md` show `<meta name="application-name">` in the required head tags template
- New apps built after this change include the tag

---

### L-7 — Improve `AppCard` thumbnail alt text

**File:** `components/AppCard.jsx:23`

**Problem:** `alt=""` on thumbnail images. While the surrounding link has the app name as text, a descriptive alt attribute improves screen reader context.

**What to do:**
- Change `alt=""` to `alt={`${app.name} thumbnail`}` (or `alt={`Preview of ${app.name}`}`)
- This also satisfies the `jsx-a11y/img-redundant-alt` rule (once M-4 is implemented)

**Acceptance criteria:**
- Each thumbnail `<img>` has a non-empty `alt` attribute describing the image
- `npm run lint` passes (once M-4 is active)

---

## Tracking

| ID  | Title                                          | Status |
|-----|------------------------------------------------|--------|
| H-1 | Add tests and linting to CI pipeline           | ✅ done |
| H-2 | Fix path traversal in app-log API              | ✅ done |
| H-3 | Break up homepage monolith                     | ✅ done |
| H-4 | Add tests for API routes                       | ✅ done |
| H-5 | Eliminate redundant per-card Supabase queries  | ✅ done |
| M-1 | Extract shared `verifyTurnstile()`             | ✅ done |
| M-2 | Extract shared `formatDuration()`              | ✅ done |
| M-3 | Add focus trapping to modals                   | ✅ done |
| M-4 | Enable `jsx-a11y` ESLint rules                 | 🔲 todo |
| M-5 | Add `prefers-reduced-motion` support           | 🔲 todo |
| M-6 | Fix vacuous test assertions                    | 🔲 todo |
| M-7 | Add Markdown escaping to suggestions route     | 🔲 todo |
| M-8 | Add server-side vote deduplication             | 🔲 todo |
| M-9 | Fix `npm run format` scope                     | 🔲 todo |
| L-1 | Add TypeScript (incremental migration)         | 🔲 todo |
| L-2 | Clean up legacy docs                           | 🔲 todo |
| L-3 | Add pre-commit hook with lint-staged           | 🔲 todo |
| L-4 | Add responsive header nav menu                 | 🔲 todo |
| L-5 | Standardize script file extensions             | 🔲 todo |
| L-6 | Add `application-name` meta to agent templates | 🔲 todo |
| L-7 | Improve `AppCard` thumbnail alt text           | 🔲 todo |
