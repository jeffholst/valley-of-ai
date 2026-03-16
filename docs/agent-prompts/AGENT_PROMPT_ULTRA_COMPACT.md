# Openclaw Agent - Ultra-Compact Pipeline Prompt

Goal: generate one polished web app with strict step-by-step execution and immediate logging.

## Hard Rules
- Build static app only (HTML/CSS/JS), mobile + desktop.
- Use UTC OS time: `date -u +"%Y-%m-%dT%H:%M:%SZ"`.
- Keep placeholders unchanged: `__GA_MEASUREMENT_ID__`, `__MAIN_SITE_URL__`, `__MAIN_SITE_NAME__`, `__SOCIAL_X_URL__`, `__SOCIAL_FACEBOOK_URL__`, `__SOCIAL_INSTAGRAM_URL__`. (Auto-replaced by `sync-public-content.mjs` during build).
- Use shared shell. Do not custom global header/footer/theme toggle.
- Log each step immediately after completion (never batch logs).
- Do not continue past validation failure.

## Required Output Paths
- App dir: `apps/YYYY/MM/DD/<app-id>/`
- Log file: `apps/YYYY/MM/DD/<app-id>/log.jsonl`
- Required app files:
  - `index.html`
  - `log.jsonl`
  - `thumbnail.svg` (800x450)
  - `meta.json`

## Required `index.html` Contracts
- Title format:
  - `<title>App Name - __MAIN_SITE_NAME__</title>`
- Include GA snippet with `__GA_MEASUREMENT_ID__`.
- Include shared shell tags:
```html
<meta name="voa-main-site-url" content="__MAIN_SITE_URL__">
<meta name="voa-main-site-name" content="__MAIN_SITE_NAME__">
<meta name="voa-social-x-url" content="__SOCIAL_X_URL__">
<meta name="voa-social-facebook-url" content="__SOCIAL_FACEBOOK_URL__">
<meta name="voa-social-instagram-url" content="__SOCIAL_INSTAGRAM_URL__">
<script src="/apps/shared/app-shell.js" defer></script>
```
- Use theme variables with light/dark support via shared theme key.

## Required `meta.json` Fields
- `id`, `name`, `shortDescription`, `thumbnail`, `createdAt`, `category`, `status`, `tags`, `homepagePath`, `inputMode`, `generation`
- `generation` must include:
  - `agentName`, `llmModel`, `startTime`, `endTime`, `totalTokensIn`, `totalTokensOut`, `runId`, `notes`

## Logging Contract
**⚠️ CRITICAL: REAL-TIME LOGGING (DO NOT SKIP)**
- Create the app folder before any logging starts so `log.jsonl` exists in final location from the start
- **After EVERY step (1-14), immediately append the log entry to `log.jsonl` within seconds of step completion**
- Execution pattern (MANDATORY): Execute step → Log immediately → Move to next step
- **DO NOT batch logs at the end. DO NOT skip logging any step.**
- Never log app-generation workflow state to a shared daily file under `/logs`
- Failure consequence: Missing logs = broken pipeline audit trail

Transaction format:
1. `TRANSACTION_START`
2. `STEP` entries (must log all 14)
3. `TRANSACTION_END`

Run id format:
- `run-YYYYMMDDTHHMMSSZ-xxxxxx`

Step order and sequence numbers:
1. `SELECT_SUGGESTION`
2. `RESEARCH_IDEAS`
3. `GENERATE_HTML`
4. `GENERATE_THUMBNAIL`
5. `CREATE_META_JSON`
6. `VALIDATE_APP`
7. `GIT_CHECKOUT_BRANCH`
8. `GIT_COMMIT`
9. `GIT_PUSH`
10. `CREATE_PR`
11. `PR_REVIEW`
12. `UPDATE_REGISTRY`
13. `MERGE_PR_DEPLOY`
14. `DELETE_BRANCH`

Status values:
- `started`, `in_progress`, `completed`, `failed`, `retrying`, `skipped`, `cancelled`

If failure occurs:
- log `failed` with error object `{code,message,retryable}`
- fix, log `retrying`, then log completion

## Execute Exactly in Order
0. Prep
- Pull latest main.
- Fetch UTC time.
- Derive paths and `runId`.
- Create `apps/YYYY/MM/DD/<app-id>/` first.
- **Create empty `log.jsonl` file** in `apps/YYYY/MM/DD/<app-id>/log.jsonl` before any logging begins.
- Append `TRANSACTION_START` to `apps/YYYY/MM/DD/<app-id>/log.jsonl`.

1. Select concept
- Check all existing apps in /apps folder and do not duplicate concepts.
- Pick non-duplicate app.
- Log `SELECT_SUGGESTION`.

2. Research
- Capture 2-3 inspirations + one unique angle.
- Log `RESEARCH_IDEAS`.

3. Build app
- Create `index.html` with required contracts.
- Ensure touch + keyboard support where needed.
- Add favicon.
- Log `GENERATE_HTML`.

4. Thumbnail
- Create `thumbnail.svg` (actual UI look/state).
- Log `GENERATE_THUMBNAIL`.

5. Metadata
- Create `meta.json` with required fields and accurate generation timing/token counts.
- Log `CREATE_META_JSON`.

6. Validate (blocking)

### Functional Testing
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

When passed, **Log `VALIDATE_APP` immediately**.

7. Git branch + commit (app files only)
- Execute: `git checkout -b feat/<app-id>` → **Log `GIT_CHECKOUT_BRANCH` immediately**
- Stage and commit app files ONLY (index.html, meta.json, thumbnail.svg): `git add ...` then `git commit ...`
  - **Log `GIT_COMMIT` immediately with SHA** (capture from commit output)
  - **Do NOT commit log.jsonl yet** — it will be finalized in step 9 after all transactions complete

8. PR flow + Merge
- Execute: `git push origin feat/<app-id>` → **Log `GIT_PUSH` immediately**
- Execute: `gh pr create --title "..." --body "..."` → **Log `CREATE_PR` with PR #/URL immediately**
- Execute: Self-review → **Log `PR_REVIEW` immediately**
- Execute: `npm run generate:apps` (update registry before merge, so registry and app deploy together) → **Log `UPDATE_REGISTRY` immediately**
- Execute: `gh pr merge <pr-number> --squash --auto` → **Log `MERGE_PR_DEPLOY` immediately after merge succeeds**
- Wait ~2–3 min for Vercel auto-deployment (webhook triggered automatically on main merge)
- Verify on main: `git checkout main && git pull origin main`
- Verify app files live in public/apps/YYYY/MM/DD/<app-id>/
- Delete feature branch (local and remote):
  - `git branch -d feat/<app-id>`
  - `git push origin --delete feat/<app-id>`
  - → **Log `DELETE_BRANCH` immediately**

9. Finalize transaction log and commit
- Append `TRANSACTION_END` to `apps/YYYY/MM/DD/<app-id>/log.jsonl` after all logging steps (1-14) complete.
- **CRITICAL: Commit log.jsonl with `[skip deploy]` tag (separate, final commit):**
  ```bash
  git add apps/YYYY/MM/DD/<app-id>/log.jsonl
  git commit -m "chore: finalize transaction log for <app-id> [skip deploy]"
  git push origin main
  ```
  - **MUST include `[skip deploy]` in commit message** — prevents unnecessary Vercel redeploy (log.jsonl is metadata only, app is already deployed as part of Step 13 MERGE_PR_DEPLOY).