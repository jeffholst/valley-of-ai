# Openclaw Agent - Ultra-Compact Pipeline Prompt

Goal: generate one Valley of AI app with strict step-by-step execution and immediate logging.

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
Create the app folder before any logging starts so logging begins directly in the final app location.
Never log app-generation workflow state to a shared daily file under `/logs`.

Transaction format:
1. `TRANSACTION_START`
2. `STEP` entries
3. `TRANSACTION_END`

Run id format:
- `run-YYYYMMDDTHHMMSSZ-xxxxxx`

Step names + seq:
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
- Run `npm run validate:apps`.
- Must pass before continuing.
- Log `VALIDATE_APP`.

7. Git branch + commit
- `git checkout -b feat/<app-id>`
- Log `GIT_BRANCH`.
- Commit app + logs.
- Log `GIT_COMMIT` (include SHA).

8. PR flow + Merge
- Push branch and create PR: `git push origin feat/<app-id>` then `gh pr create --title "..." --body "..."`.
- Log `CREATE_PR` (PR number/url).
- Self-review and log `PR_REVIEW`.
- **Execute squash merge**: `gh pr merge <pr-number> --squash --auto`.
- Verify merge succeeded: `git log --oneline -1` should show commit on main.
- Verify on main branch: `git checkout main && git pull origin main`.
- Delete feature branch if not auto-deleted: `git branch -D feat/<app-id>`.
- Log `MERGE_PR` with status confirmed.

9. Registry + deploy
- Run `npm run generate:apps`; log `UPDATE_REGISTRY`.
- Verify PR is merged to `main` (git status should show no uncommitted app changes).
- Run `npm run sync` to copy app to public/apps.
- Vercel pipeline (if enabled): auto-triggers on main merge → loads env → replaces placeholders → next build → deploy to edge.
- Zero-downtime deploy + auto-rollback on fail. Live in ~2–3 min.
- Verify app files in public/apps/YYYY/MM/DD/<app-id>/; log `DEPLOY`.

10. Close
- Append `TRANSACTION_END`.
- Ensure `apps/YYYY/MM/DD/<app-id>/log.jsonl` is staged with the app files.

## Final Gate Checklist
- Shared shell header/footer visible.
- Dark/light mode works.
- App works on mobile + desktop.
- Game runtime checks pass (visibility, controls, score/state, win/loss, restart).
- `npm run validate:apps` passes.
- Thumbnail matches app.
- `log.jsonl` exists in the app folder before the first log entry.
- If modifying src/ (codebase components): `npm run lint` + `npm run format` + `npm test` + `npm run build` all pass.
- All steps logged in sequence with same `runId`.

Agent: openclaw-dev-agent | Model: gpt-5.1 | Priority: reliable pipeline + immediate logging
