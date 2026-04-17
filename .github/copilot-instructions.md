# Copilot Cloud Agent Instructions — Valley of AI

## Project Overview

Valley of AI is a **Next.js 16 gallery** (React 19, Tailwind CSS, deployed on Vercel) that showcases AI-generated mini-apps — self-contained static HTML/CSS/JS files. AI agents build new apps and apply improvements nightly via a structured pipeline. Apps live under `apps/YYYY/MM/DD/<app-id>/`.

**Node.js version:** 20 (LTS). **Package manager:** npm.

---

## First Steps — Always Run Before Making Changes

```bash
npm ci                   # Install dependencies
npm run generate:apps    # Sync data/apps.json from all meta.json files
npm run lint             # Must pass with 0 errors, 0 warnings
npm test                 # Jest — 57+ tests must pass
npm run validate:apps    # Validate HTML contracts, metadata, and registry sync
```

If `npm run lint` or `npm test` fail on a clean checkout with no changes, **document the pre-existing failures** and do not fix them unless your task specifically asks for it.

---

## Key Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (runs sync first) |
| `npm run build` | Production build (runs sync first) |
| `npm run sync` | Copy `apps/` + `logs/` → `public/` with placeholder replacement |
| `npm run generate:apps` | Regenerate `data/apps.json` from all `apps/*/meta.json` |
| `npm run generate:versus` | Regenerate `data/versus-registry.json` from `versus.json` + `apps.json` |
| `npm run validate:apps` | Validate HTML contracts, metadata schema, registry sync |
| `npm run validate:responsive:sample` | Responsive check on 5 apps (fast spot-check) |
| `npm run lint` | ESLint — 0 errors, 0 warnings required |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Prettier (100 char, single quotes, 2-space indent) |
| `npm test` | Jest unit tests |
| `npm run log` | Append a structured pipeline log entry |
| `npm run issues:pending` | List pending suggestion/improvement issues |
| `npm run issues:decide` | Apply approved/rejected/human-review issue decisions |
| `npm run select:app:suggestion` | (Agent use only) Recommend next new app concept |
| `npm run select:app:improvement` | (Agent use only) Recommend next improvement |

---

## Repository Layout

```
apps/YYYY/MM/DD/<app-id>/
  index.html       # Self-contained static app (no build step)
  meta.json        # App metadata + generation info
  thumbnail.svg    # 800×450 SVG preview image
  log.jsonl        # Per-app pipeline log (JSONL, NOT committed with app files)

data/apps.json              # Committed registry — run generate:apps after meta.json changes
data/versus.json            # Hand-authored versus competition definitions (source of truth)
data/versus-registry.json   # Generated enriched registry — run generate:versus to rebuild
logs/YYYY/MM/DD.jsonl       # Central daily log for all pipeline runs

docs/agent-prompts/
  AGENT_PROMPT_SHARED.md      # Required reading for every pipeline run
  AGENT_PROMPT_NEW_APP.md     # 14-step pipeline for building a new app
  AGENT_PROMPT_IMPROVEMENT.md # 14-step pipeline for applying an improvement
  AGENT_PROMPT_ISSUE_REVIEW.md # Reviews pending issues for legitimacy

scripts/
  generate-apps.mjs           # Rebuilds data/apps.json
  generate-versus.mjs         # Rebuilds data/versus-registry.json
  sync-public-content.mjs     # Copies apps/ + logs/ to public/, replaces __PLACEHOLDER__ tokens
  validate-apps.mjs           # Full validation suite
  logger.mjs                  # CLI: npm run log
  issues/
    select-app-suggestion.mjs  # Picks next app concept
    select-app-improvement.mjs # Picks next improvement request
    retrieve-pending-issues.mjs
    decide-issue.mjs
    lib/
      issue-selection-heuristics.js  # Pure utility functions (unit-tested)

__tests__/
  scripts/issues/lib/issue-selection-heuristics.test.js  # 31 tests
  components/AppLog.groupLogs.test.js                    # 14 tests

app/                  # Next.js App Router pages
components/           # Shared React components
hooks/                # Custom React hooks
lib/                  # Shared server/client utilities
styles/               # Global CSS
supabase/             # Database migrations
guardrails.example    # Template for private issue-review guardrails
```

---

## AI Agent Pipelines

All three pipeline flows start by reading `docs/agent-prompts/AGENT_PROMPT_SHARED.md`.

- **New app:** `AGENT_PROMPT_SHARED.md` + `AGENT_PROMPT_NEW_APP.md`
- **Improvement:** `AGENT_PROMPT_SHARED.md` + `AGENT_PROMPT_IMPROVEMENT.md`
- **Issue review:** `AGENT_PROMPT_SHARED.md` + `AGENT_PROMPT_ISSUE_REVIEW.md`

**Never** manually run `select:app:suggestion` or `select:app:improvement` and hand the output to an agent — the agent runs these scripts itself as part of the pipeline.

If `guardrails.production` exists (git-ignored), load it as a policy overlay; otherwise use `guardrails.example`.

---

## Pipeline Logging

Every pipeline step must be logged **immediately after** execution:

```bash
npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD \
  --category pipeline --step <STEP_NAME> --seq <N> --status completed \
  --durationMs <ms> --tokensIn <n> --tokensOut <n> --message "..."
```

- **Categories:** `pipeline` | `reasoning` | `validation`
- `npm run log` writes to **two files simultaneously**: `apps/<path>/log.jsonl` AND `logs/YYYY/MM/DD.jsonl`
- `log.jsonl` files are **NOT committed with app files** — they go in a separate final commit on main after the PR is merged.
- Final log commit message: `chore: finalize transaction logs for <app-id>`

---

## Git Workflow

- **Branch naming:** `feat/<app-id>` for new apps, `improve/<app-id>` for improvements
- App/improvement commit messages **must include `[skip deploy]`** — this tells Vercel to skip deployment
- **Never** use `git add .` or `git add -A` — stage files explicitly by path
- `data/apps.json` must be committed in the same PR as any `meta.json` changes (run `npm run generate:apps` first)

---

## Required Conventions for App `index.html`

Every app's `index.html` must include these head tags **exactly as shown** — `__PLACEHOLDER__` tokens are replaced at build time by `sync-public-content.mjs`:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=__GA_MEASUREMENT_ID__"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', '__GA_MEASUREMENT_ID__');
</script>

<meta name="voa-main-site-url" content="__MAIN_SITE_URL__" />
<meta name="voa-main-site-name" content="__MAIN_SITE_NAME__" />
<meta name="voa-github-url" content="__GITHUB_URL__" />
<meta name="voa-social-x-url" content="__SOCIAL_X_URL__" />
<meta name="voa-social-facebook-url" content="__SOCIAL_FACEBOOK_URL__" />
<meta name="voa-social-instagram-url" content="__SOCIAL_INSTAGRAM_URL__" />
<meta name="application-name" content="App Name" />
<meta name="voa-app-id" content="YYYY/MM/DD/<app-id>" />
<script src="/apps/shared/app-shell.js" defer></script>
```

- Replace `App Name` in `application-name` with the actual app name (same value as `<title>` before ` - __MAIN_SITE_NAME__`)
- Replace `YYYY/MM/DD/<app-id>` in `voa-app-id` with the actual app path — this is the **only** placeholder that should be replaced with a real value
- **Do NOT** hardcode real URLs or API keys — use `__PLACEHOLDER__` tokens
- **Do NOT** hand-code a header, footer, or theme toggle — the shared shell (`app-shell.js`) injects these at runtime

### Required Theme CSS Variables

```css
:root {
  --bg: #0f172a;
  --text: #f9fafb;
  --surface: #1e293b;
}
[data-theme='light'] {
  --bg: #ffffff;
  --text: #1f2937;
  --surface: #f3f4f6;
}
```

---

## Thumbnail Spec (`thumbnail.svg`)

- `viewBox="0 0 800 450"` — exactly this size
- No `<animate>` tags — renders statically
- No `--` inside XML comments (invalid XML)
- Show a mid-use state (not a blank start screen)
- Must include at least one gradient and one filter effect
- Validate with: `xmllint --noout thumbnail.svg`

---

## `meta.json` Schema

The authoritative schema is at `docs/json-schema/meta.json`.

**Required fields:** `id`, `name`, `shortDescription`, `thumbnail`, `createdAt`, `category`, `status`, `tags`, `homepagePath`, `inputMode`, `generation`

**Key constraints:**
- `id`: lowercase kebab-case (e.g. `snake-game`)
- `category`: `Games` | `Productivity` | `Utilities` | `Design` | `Education` | `Entertainment` | `Visualizations`
- `inputMode`: `desktop` | `mobile` | `responsive`
- `status`: `active` | `experimental` | `retired`
- `tags`: 2–8 unique strings, each 2–30 characters
- `thumbnail`: always `"thumbnail.svg"`
- `homepagePath`: always `"index.html"`
- `createdAt`: UTC ISO 8601 (e.g. `2026-03-23T17:45:55Z`)
- `generation.runId`: format `run-YYYYMMDDTHHMMSSZ-xxxxxx`

**Optional fields:**
- `visible`: `false` to hide from gallery without deleting
- `allowImprovements`: `false` to prevent community improvement submissions (pipeline skips the app automatically)
- `suggestion`: only present if built from a community suggestion issue
- `improvements`: appended by the improvement pipeline; **do not set during initial app creation**

After any `meta.json` change, run `npm run generate:apps` and commit `data/apps.json` in the same PR.

---

## Versus (Model Comparison) Feature

- `data/versus.json` — hand-authored source of truth (each entry has `id`, `title`, `prompt`, `category`, `createdAt`, `entries[]`)
- `data/versus-registry.json` — generated; run `npm run generate:versus` after editing `versus.json`
- Versus apps live in the normal `apps/YYYY/MM/DD/` tree — no special directory
- Voting uses Supabase `versus_votes` table (`versus_id`, `voted_app_id` columns)

---

## ESLint Rules (Key)

- `no-unused-vars` — warn (prefix with `_` to suppress)
- `no-console` — warn (except `console.warn` and `console.error`; scripts directory is exempt)
- `prefer-const` — error
- `eqeqeq` — always use `===`
- `semi` — always required
- `quotes` — single quotes
- `no-var` — error (use `const`/`let`)
- ESLint covers: `app/`, `components/`, `hooks/`, `lib/`, `scripts/`, `__tests__/`
- Ignored: `.next/`, `out/`, `dist/`, `node_modules/`, `public/apps/`, `public/logs/`

---

## Testing

```bash
npm test                 # Run all Jest tests
npm run test:coverage    # Coverage report
```

- Test files mirror source structure under `__tests__/`
- Pure logic (no external deps) → unit tests
- React component rendering → `jest-environment-jsdom`
- CLI entrypoints in `scripts/issues/` are **not** unit-tested directly; test the pure functions in `scripts/issues/lib/issue-selection-heuristics.js` instead

---

## Environment Variables

Copy `.env.example` to `.env` for local development. **Never commit real secrets.**

Key variables:
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY` — server-only, never `NEXT_PUBLIC_`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `GITHUB_SUGGESTIONS_TOKEN`, `GITHUB_REPO` — used by issue scripts
- `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Various `NEXT_PUBLIC_SITE_*` and `NEXT_PUBLIC_SOCIAL_*` config values

---

## CI / Deployment

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs on push to `main` and on PRs:
1. `npm ci`
2. `npm run generate:apps`
3. `npm run lint`
4. `npm test`
5. `npm run validate:apps`
6. `npm run build` (push to main only)

Deployment to Vercel is triggered by pushes to `main`. Include `[skip deploy]` in commit messages for app/improvement files to prevent unnecessary Vercel builds.

---

## What NOT to Do

- Do **not** hardcode real URLs or API keys in any `index.html` — use `__PLACEHOLDER__` tokens
- Do **not** hand-code a header, footer, or theme toggle in app HTML
- Do **not** commit `log.jsonl` files in the same commit as app files
- Do **not** run `npm run select:app:suggestion` or `npm run select:app:improvement` and hand the output to an agent manually
- Do **not** bypass the pending issue review workflow for `status:pending` issues
- Do **not** skip `[skip deploy]` in app/improvement commit messages
- Do **not** use `git add .` or `git add -A`
- Do **not** proceed with the improvement pipeline if `select-app-improvement.mjs` returns `found: false`
- Do **not** add `improvements` to `meta.json` during initial app creation
- Do **not** add `--` inside SVG XML comments (invalid XML)
