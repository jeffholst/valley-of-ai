## 1) Mission
Build one production ready web app with the following requirements: 

- Static only: HTML/CSS/JS (no backend).
- Must work on mobile and desktop and be fully responsive.
- Must support keyboard, mouse and gesture touch
- Must be visually polished and usable immediately.
- Must include accurate metadata and logs.
- Must complete full git workflow: branch -> commit -> PR -> merge 

## 2) Non-Negotiable Contracts

### Time source (required)
Always use OS UTC time before creating paths or timestamps:
- `date -u +"%Y-%m-%dT%H:%M:%SZ"`

Use UTC consistently for:
- File paths: `apps/YYYY/MM/DD/<app-id>/`
- App-local log file: `apps/YYYY/MM/DD/<app-id>/log.jsonl`
- `meta.json`: `createdAt`, `generation.startTime`, `generation.endTime`
- `runId` timestamp portion

### Model Reporting
Make best attempt effort to report your agent name correctly AND the LLM being used.

### Required app files
```
apps/YYYY/MM/DD/<app-id>/
  index.html
  log.jsonl
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
Log in JSONL to `apps/YYYY/MM/DD/<app-id>/log.jsonl`.

Each app run is one transaction:
1. `TRANSACTION_START`
2. `STEP` entries for each pipeline stage
3. `TRANSACTION_END`

### ⚠️ CRITICAL: REAL-TIME LOGGING (DO NOT SKIP)
**This rule is non-negotiable and must be followed exactly:**

1. Create the app folder **before any logging begins** so `log.jsonl` exists in the final app location from the start.
2. **After EVERY step completes (Steps 1-13), immediately append the log entry to `log.jsonl`.**
3. **Execution pattern (MANDATORY):**
   - Execute step (validate, git command, PR, merge, deploy, etc.)
   - Immediately log that step to `log.jsonl` (within seconds, not later)
   - Move to next step
   - **DO NOT batch logs at the end. DO NOT skip logging any step.**
4. Never log to a shared daily file under `/logs` for app-generation workflow state.

**Failure consequence:** Missing logs = incomplete transaction records = pipeline audit trail is broken. This defeats the purpose of the transaction log.

**Implementation:** After running each command/operation in the pipeline, always call:
```bash
echo '{"timestamp":"<ISO8601>","runId":"<runId>","type":"STEP","step":"<STEP_NAME>","seq":<N>,"status":"completed","durationMs":<duration>}' >> apps/YYYY/MM/DD/<app-id>/log.jsonl
```

**Commit strategy:** 
- Commit app files (index.html, meta.json, thumbnail.svg) in Step 7 first.
- Append `TRANSACTION_END` after all steps (8-9) complete.
- Commit `log.jsonl` **as a final, separate commit (Step 10)** after all logging transactions are finalized — this prevents stale log states after PR merges.

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
4. Create the app folder immediately: `apps/YYYY/MM/DD/<app-id>/`.
5. Create `runId`.
6. **Create empty `log.jsonl` file** in `apps/YYYY/MM/DD/<app-id>/log.jsonl` (will be populated as pipeline progresses).
7. Write initial `TRANSACTION_START` to `apps/YYYY/MM/DD/<app-id>/log.jsonl`.

### Step 1: Idea selection
1. Check all existing apps in /apps folder to avoid duplicates.
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
3. Make the thumbnail visually appealling
4. Log `GENERATE_THUMBNAIL`.

### Step 5: Metadata
Create `meta.json` with required fields:
- `id`, `name`, `shortDescription`, `thumbnail`, `createdAt`, `category`, `status`, `tags`, `homepagePath`, `inputMode`, `generation`
- `generation` must include: `agentName`, `llmModel`, `startTime`, `endTime`, `totalTokensIn`, `totalTokensOut`, `runId`, `notes`

Then log `CREATE_META_JSON`.

### Step 6: Validate (blocking gate)

#### Functional Testing
Before continuing confirm:
- App runs without errors.
- Shared shell header/footer visible.
- Dark/light theme works.
- Mobile + desktop layout works.
- Interactive controls work (touch + keyboard where applicable).
- If game: gameplay objects visible, score/state updates, win/loss/restart all work.
- Thumbnail matches app UI.

Run:
- `npm run validate:apps`
- `npm run generate:apps`
- `npm run lint` passes (0 errors, 0 warnings).
- `npm run format` applied (Prettier 100-char, single quotes, 2-space indentation).
- `npm test` passes (all test suites passing).
- `npm run build` completes successfully. 

If validation fails:
- fix issues,
- log failed/retrying/completed statuses accordingly,
- do not continue until passing.

When passed, log `VALIDATE_APP`.

### Step 7: Git branch and commit (app files only)
**Pattern: Execute → Log immediately → Move to next**

1. Execute: `git checkout -b feat/<app-id>`
   - **LOG IMMEDIATELY:** `GIT_BRANCH` step to `log.jsonl`
2. **Stage and commit app files ONLY** (index.html, meta.json, thumbnail.svg).
   - Execute: `git add` and `git commit`
   - **LOG IMMEDIATELY:** `GIT_COMMIT` step with commit SHA to `log.jsonl` (capture SHA from commit output)
   - **Do NOT commit log.jsonl yet** — it will be finalized in Step 10 after all transactions complete.

### Step 8: PR flow
**Pattern: Execute → Log immediately → Move to next**

1. Execute: Push branch: `git push -u origin feat/<app-id>`
   - **LOG IMMEDIATELY:** `GIT_PUSH` step to `log.jsonl`
2. Execute: Create PR: `gh pr create --title "..." --body "..."`
   - **LOG IMMEDIATELY:** `CREATE_PR` step with PR number/URL to `log.jsonl`
3. Execute: Self-review PR (check code quality, tests, etc.)
   - **LOG IMMEDIATELY:** `PR_REVIEW` step to `log.jsonl`
4. Execute: Merge PR with squash: `gh pr merge <pr-number> --squash --auto`
   - **LOG IMMEDIATELY:** `MERGE_PR` step to `log.jsonl` after merge succeeds
   - Verify merge on main: `git checkout main && git pull origin main`

### Step 9: Registry + deploy
**Pattern: Execute → Log immediately → Move to next**

1. Execute: `npm run generate:apps`
   - **LOG IMMEDIATELY:** `UPDATE_REGISTRY` step to `log.jsonl`
2. Verify PR is merged to `main` (git log should show your commit)
   - **Merged on main: Vercel auto-deploys** (webhook → build → deploy to edge)
   - Wait ~2–3 minutes for deployment to complete
3. Verify app is live in public folder and accessible
   - Execute: `npm run sync` (if needed to manually copy to public)
   - **LOG IMMEDIATELY:** `DEPLOY` step to `log.jsonl` once app is confirmed live

> **Note:** Deployment is automatic via Vercel when code is pushed to `main`. Environment variable placeholders are replaced during build from `.env.production` secrets.

### Step 10: Finalize transaction log and commit
After all logging transactions are complete (Steps 1-9), perform the final log commit:
1. Append `TRANSACTION_END` to `apps/YYYY/MM/DD/<app-id>/log.jsonl`.
2. **This is the FINAL COMMIT:** Stage only `log.jsonl` with the transaction data.
3. **CRITICAL: Commit with `[skip deploy]` tag to prevent unnecessary Vercel redeploy:**
   ```bash
   git add apps/YYYY/MM/DD/<app-id>/log.jsonl
   git commit -m "chore: finalize transaction log for <app-id> [skip deploy]"
   ```
   - **MUST include `[skip deploy]` in commit message** — tells Vercel not to redeploy (log.jsonl is metadata only, app already deployed in Step 9)
4. **Push this commit directly to the main branch:** `git push origin main`

> **⚠️ CRITICAL WARNING:** If `[skip deploy]` is omitted from the commit message, Vercel will trigger an unnecessary rebuild/redeploy cycle. ALWAYS verify the commit message contains `[skip deploy]` before pushing.

