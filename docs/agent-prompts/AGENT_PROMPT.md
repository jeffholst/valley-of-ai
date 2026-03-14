# Openclaw Agent - Lean App Generation Prompt

This version is optimized for clarity and small models.
Primary goal: follow a strict pipeline and log each step immediately.

## 1) Mission
Build one polished, mobile-first web app for Valley of AI.

Constraints:
- Static only: HTML/CSS/JS (no backend).
- Must work on mobile and desktop.
- Must be visually polished and usable immediately.
- Must include accurate metadata and logs.
- Must complete full git workflow: branch -> commit -> PR -> merge -> deploy.

## 2) Non-Negotiable Contracts

### Time source (required)
Always use OS UTC time before creating paths or timestamps:
- `date -u +"%Y-%m-%dT%H:%M:%SZ"`

Use UTC consistently for:
- File paths: `apps/YYYY/MM/DD/<app-id>/`
- Log file: `logs/YYYY/MM/DD.jsonl`
- `meta.json`: `createdAt`, `generation.startTime`, `generation.endTime`
- `runId` timestamp portion

### Required app files
```
apps/YYYY/MM/DD/<app-id>/
  index.html
  thumbnail.svg
  meta.json
```

### Required head tags in every app `index.html`
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=__GA_MEASUREMENT_ID__"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '__GA_MEASUREMENT_ID__');
</script>

<meta name="voa-main-site-url" content="__MAIN_SITE_URL__">
<meta name="voa-main-site-name" content="__MAIN_SITE_NAME__">
<meta name="voa-social-x-url" content="__SOCIAL_X_URL__">
<meta name="voa-social-facebook-url" content="__SOCIAL_FACEBOOK_URL__">
<meta name="voa-social-instagram-url" content="__SOCIAL_INSTAGRAM_URL__">
<script src="/apps/shared/app-shell.js" defer></script>
```

Rules:
- Keep placeholders **exactly as shown** (do not hardcode real values).
- `sync-public-content.mjs` automatically replaces placeholders during build from `.env`.
- Do not hand-code global header/footer or app-local theme toggle.
- Shared shell must control header/footer/theme behavior.

### Required title format
```html
<title>App Name - __MAIN_SITE_NAME__</title>
```

### Theme support
Use CSS variables and support shared theme switching:
```css
:root { --bg:#0f172a; --text:#f9fafb; --surface:#1e293b; }
[data-theme="light"] { --bg:#ffffff; --text:#1f2937; --surface:#f3f4f6; }
```

## 3) Logging Model (Most Important)
Log in JSONL to `logs/YYYY/MM/DD.jsonl`.

Each app run is one transaction:
1. `TRANSACTION_START`
2. `STEP` entries for each pipeline stage
3. `TRANSACTION_END`

### Critical logging rule
Write each log line immediately after that step completes.
Never batch logs at the end.

### `runId` format
`run-YYYYMMDDTHHMMSSZ-xxxxxx`
- `xxxxxx` = 6-char hex suffix

### Step order and sequence numbers
1. `SELECT_SUGGESTION`
2. `RESEARCH_IDEAS`
3. `GENERATE_HTML`
4. `GENERATE_THUMBNAIL`
5. `CREATE_META_JSON`
6. `VALIDATE_APP`
7. `GIT_BRANCH`
8. `GIT_COMMIT`
9. `CREATE_PR`
10. `PR_REVIEW`
11. `MERGE_PR`
12. `UPDATE_REGISTRY`
13. `DEPLOY`

### Minimal log schemas
`TRANSACTION_START`
```json
{"timestamp":"2026-03-12T20:00:00Z","runId":"run-20260312T200000Z-a1b2c3","type":"TRANSACTION_START","appId":"example-app","status":"started","agent":"openclaw-dev-agent","llmModel":"gpt-5.1"}
```

`STEP`
```json
{"timestamp":"2026-03-12T20:00:10Z","runId":"run-20260312T200000Z-a1b2c3","type":"STEP","step":"GENERATE_HTML","seq":3,"status":"completed","durationMs":6500,"tokensIn":3000,"tokensOut":2500}
```

`TRANSACTION_END`
```json
{"timestamp":"2026-03-12T20:05:00Z","runId":"run-20260312T200000Z-a1b2c3","type":"TRANSACTION_END","appId":"example-app","status":"success","totalDurationMs":300000,"totalTokensIn":5000,"totalTokensOut":4500,"filesCreated":["index.html","meta.json","thumbnail.svg"]}
```

Error format:
```json
{"code":"VALIDATION_FAILED","message":"Missing shared-shell tag","retryable":true}
```

## 4) Pipeline (Do Exactly In Order)

### Step 0: Prep
1. Pull latest main.
2. Get current UTC time.
3. Derive `YYYY/MM/DD`, log path, app path.
4. Create `runId`.
5. Append `TRANSACTION_START`.

### Step 1: Idea selection
1. Check existing apps to avoid duplicates.
2. Check suggestions files if present.
3. Choose one app concept and category.
4. Log `SELECT_SUGGESTION`.

### Step 2: Research
1. Do brief targeted research for mechanics + UX.
2. Capture 2-3 inspirations and one unique angle.
3. Log `RESEARCH_IDEAS` with details.

### Step 3: Generate app
1. Create `index.html` with required shell/analytics tags.
2. Ensure mobile-first, keyboard/touch friendly.
3. Add favicon.
4. Log `GENERATE_HTML`.

### Step 4: Generate thumbnail
1. Create `thumbnail.svg` (`viewBox="0 0 800 450"`).
2. Match actual app UI/colors/state.
3. Log `GENERATE_THUMBNAIL`.

### Step 5: Metadata
Create `meta.json` with required fields:
- `id`, `name`, `shortDescription`, `thumbnail`, `createdAt`, `category`, `status`, `tags`, `homepagePath`, `inputMode`, `generation`
- `generation` must include: `agentName`, `llmModel`, `startTime`, `endTime`, `totalTokensIn`, `totalTokensOut`, `runId`, `notes`

Then log `CREATE_META_JSON`.

### Step 6: Validate (blocking gate)
Run:
- `npm run validate:apps`

If validation fails:
- fix issues,
- log failed/retrying/completed statuses accordingly,
- do not continue until passing.

When passed, log `VALIDATE_APP`.

### Step 7: Git branch and commit
1. `git checkout -b feat/<app-id>`
2. Log `GIT_BRANCH`.
3. Stage and commit app + logs.
4. Log `GIT_COMMIT` with commit SHA.

### Step 8: PR flow
1. Push branch.
2. Create PR to `main`.
3. Log `CREATE_PR` with PR number/url.
4. Self-review PR.
5. Log `PR_REVIEW`.
6. Merge PR (squash).
7. Log `MERGE_PR`.

### Step 9: Registry + deploy
1. Run `npm run generate:apps`.
2. Log `UPDATE_REGISTRY`.
3. Merge PR to `main` (automatic GitHub Actions will trigger build).
4. Vercel auto-deploys: webhook triggers → loads env vars → runs build pipeline (`generate-apps` → `sync-public-content.mjs` replaces placeholders → `next build`) → deploys to edge network with zero-downtime updates.
5. Rollback automatic if build/deployment fails.
6. Log `DEPLOY` once the live site confirms new app is visible (~2–3 minutes from push).

> **Note:** Deployment is fully automatic via Vercel when code is pushed to `main`. No manual steps needed. Environment variable placeholders (`__GA_MEASUREMENT_ID__`, `__MAIN_SITE_URL__`, `__SOCIAL_*_URL__`) are replaced during the `sync-public-content.mjs` phase from `.env.production` secrets.

### Step 10: Close transaction
1. Append `TRANSACTION_END`.
2. If logs changed on `main`, commit and push:
   - `git add logs/`
   - `git commit -m "chore(logs): record deploy for <app-id>"`
   - `git push`

## 5) Quality Gates (Must Pass)

### Functional Testing
Before commit/PR/deploy, confirm:
- App runs without errors.
- Shared shell header/footer visible.
- Dark/light theme works.
- Mobile + desktop layout works.
- Interactive controls work (touch + keyboard where applicable).
- If game: gameplay objects visible, score/state updates, win/loss/restart all work.
- Thumbnail matches app UI.

### Validation & Standards
- `npm run validate:apps` passes (registry structure validation).
- `npm run generate:apps` completes without errors.

### Main Codebase Changes (if modifying src/)
- `npm run lint` passes (0 errors, 0 warnings).
- `npm run format` applied (Prettier 100-char, single quotes, 2-space indentation).
- `npm test` passes (all test suites passing).
- `npm run build` completes successfully.

See [STYLE_GUIDE.md](../STYLE_GUIDE.md) for code conventions and [TESTING.md](../TESTING.md) for test requirements.

## 6) Compact Checklist (Quick Reference)

**Setup & Logging**:
- [ ] UTC time fetched from OS; transaction started with `runId`
- [ ] RESEARCH_IDEAS logged with mechanics, UX insights, 2-3 inspirations
- [ ] GENERATE_HTML logged after index.html creation
- [ ] GENERATE_THUMBNAIL logged after thumbnail.svg creation

**File Requirements**:
- [ ] index.html created with shared shell + analytics tags + placeholders (not hardcoded)
- [ ] meta.json created with all required fields (id, name, tags, generation metadata)
- [ ] thumbnail.svg created (800x450 viewBox) matching app UI/colors/state
- [ ] favicon present in app directory

**Functionality & UI**:
- [ ] App runs without errors on localhost
- [ ] Shared shell header/footer visible; theme toggle functional
- [ ] Mobile + desktop layouts both working
- [ ] Interactive controls work (touch + keyboard)
- [ ] Game apps: objects visible, score updates, win/loss/restart work

**Code Quality** (if modifying src/):
- [ ] `npm run lint` passes (0 errors/warnings)
- [ ] `npm run format` applied
- [ ] `npm test` passes (all suites)
- [ ] `npm run build` succeeds

**Validation & Deploy**:
- [ ] `npm run validate:apps` passes
- [ ] PR created with description + testing steps
- [ ] Merged to `main`; Vercel deployment completes (~2–3 min)
- [ ] DEPLOY logged once live site confirms
- [ ] Validation passed
- [ ] Branch/commit/PR/review/merge completed
- [ ] Deploy completed and verified
- [ ] Transaction ended

## 7) Operating Principle
Prefer simple, complete, and shippable over complex.
If a step fails, log failure immediately, recover, log retry, continue.
Never skip logging.