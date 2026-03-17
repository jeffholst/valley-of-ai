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
⚠️ Make your best effort to report your agent name correctly AND the LLM being used.

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
All logging is handled by `npm run log`. Each app run is one transaction (TRANSACTION_START → STEP entries → TRANSACTION_END), automatically logged to `apps/YYYY/MM/DD/<app-id>/log.jsonl`.

### ⚠️ CRITICAL: REAL-TIME LOGGING (DO NOT SKIP)
**This rule is non-negotiable and must be followed exactly:**

1. Create the app folder **before any logging begins** so `log.jsonl` exists in the final app location from the start.
2. **After EVERY step completes (Steps 1-14), immediately append the log entry to `log.jsonl`.**
3. **Execution pattern (MANDATORY):**
   - Execute step (validate, git command, PR, merge, deploy, etc.)
   - Immediately log that step to `log.jsonl` (within seconds, not later)
   - Move to next step
   - **DO NOT batch logs at the end. DO NOT skip logging any step.**
4. Never log to a shared daily file under `/logs` for app-generation workflow state.

**Failure consequence:** Missing logs = incomplete transaction records = pipeline audit trail is broken. This defeats the purpose of the transaction log.

**Implementation:** Use the unified logging utility to log each step immediately after completion:
```bash
npm run log -- \
  --runId <runId> \
  --appId <app-id> \
  --category pipeline \
  --step <STEP_NAME> \
  --seq <N> \
  --status completed \
  --durationMs <duration> \
  --tokensIn <tokens> \
  --tokensOut <tokens> \
  --message "Step description"
```

For reasoning decisions and validation checks, use `--category reasoning` or `--category validation` (see examples in Steps 1, 2, and 6 below).

**Log immediately after step completes** — don't batch or save for later. Timestamps are recorded automatically.

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
7. `GIT_CHECKOUT_BRANCH`
8. `GIT_COMMIT`
9. `GIT_PUSH`
10. `CREATE_PR`
11. `PR_REVIEW`
12. `UPDATE_REGISTRY`
13. `MERGE_PR_DEPLOY`
14. `DELETE_BRANCH`

## 4) Pipeline (Do Exactly In Order)

### Step 0: Prep
1. Pull latest main.
2. Get current UTC time: `date -u +"%Y-%m-%dT%H:%M:%SZ"`
3. Derive `YYYY/MM/DD` and app paths.
4. Create the app folder: `apps/YYYY/MM/DD/<app-id>/`.
5. Generate `runId` in format: `run-YYYYMMDDTHHMMSSZ-<6-char-hex>`.
6. Log the transaction start:
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --category pipeline \
     --step TRANSACTION_START --status completed --message "Starting app generation pipeline"
   ```
   This creates `apps/YYYY/MM/DD/<app-id>/log.jsonl` and appends to central logs automatically.

### Step 1: Idea selection
1. Check all existing apps in /apps folder to avoid duplicates.
2. Check suggestions files if present.
3. Choose one app concept and category.
4. Log `SELECT_SUGGESTION`:
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --category pipeline \
     --step SELECT_SUGGESTION --seq 1 --status completed --durationMs <duration> \
     --tokensIn <in> --tokensOut <out> \
     --message "Selected [app-name] concept in [category]"
   ```
5. Optionally log reasoning (why this app over alternatives):
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --category reasoning \
     --phase SELECT_SUGGESTION --message "Why this app was chosen" \
     --decision "<app-name>" --alternatives "alt1,alt2,alt3" \
     --rationale "Reason for choice: good learning opportunity, unique mechanics, etc."
   ```

### Step 2: Research
1. Do brief targeted research for mechanics + UX.
2. Capture 2-3 inspirations and one unique angle.
3. Log `RESEARCH_IDEAS`:
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --category pipeline \
     --step RESEARCH_IDEAS --seq 2 --status completed --durationMs <duration> \
     --tokensIn <in> --tokensOut <out> \
     --message "Research complete: [mechanic summary]"
   ```
4. Optionally log reasoning about design choices:
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --category reasoning \
     --phase RESEARCH_IDEAS --message "Design decision rationale" \
     --decision "chosen-mechanic" --alternatives "alt-mechanic1,alt-mechanic2" \
     --rationale "Why this mechanic: proven engagement, good learning curve, fits constraints"
   ```

### Step 3: Generate app
Generate `index.html` with shell config tags, mobile-first responsive design, and favicon reference.

Log completion:
```bash
npm run log -- --runId <runId> --appId <app-id> --category pipeline \
  --step GENERATE_HTML --seq 3 --status completed --durationMs <duration> \
  --tokensIn <in> --tokensOut <out> \
  --message "Generated index.html with responsive layout"
```

### Step 4: Generate thumbnail
Generate `thumbnail.svg` (viewBox="0 0 800 450") matching the app's UI, colors, and state.

Log completion:
```bash
npm run log -- --runId <runId> --appId <app-id> --category pipeline \
  --step GENERATE_THUMBNAIL --seq 4 --status completed --durationMs <duration> \
  --tokensIn <in> --tokensOut <out> \
  --message "Generated thumbnail.svg"
```

### Step 5: Metadata
Generate `meta.json` with all required fields: `id`, `name`, `shortDescription`, `thumbnail`, `createdAt`, `category`, `status`, `tags`, `homepagePath`, `inputMode`, `generation` (include agentName, llmModel, startTime, endTime, totalTokensIn/Out, runId, notes).

Log completion:
```bash
npm run log -- --runId <runId> --appId <app-id> --category pipeline \
  --step CREATE_META_JSON --seq 5 --status completed --durationMs <duration> \
  --tokensIn <in> --tokensOut <out> \
  --message "Created meta.json with app metadata"
```

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

When passed, log validation checks and pipeline step:
```bash
# Example 1: Validation check - file exists
npm run log -- --runId <runId> --appId <app-id> --category validation \
  --checkType "file-exists" --name "index.html" --result PASS \
  --message "HTML file created and readable"

# Example 2: Validation check - tests pass
npm run log -- --runId <runId> --appId <app-id> --category validation \
  --checkType "test-pass" --name "npm test" --result PASS \
  --message "All test suites passing"

# Example 3: Pipeline step completion
npm run log -- --runId <runId> --appId <app-id> --category pipeline \
  --step VALIDATE_APP --seq 6 --status completed --durationMs <duration> \
  --message "All validation checks passed"
```

### Step 7: Git branch and commit (seq 7-8)
**Pattern: Execute → Log immediately → Move to next**

1. Execute: `git checkout -b feat/<app-id>`
   - **LOG IMMEDIATELY:**
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --category pipeline \
     --step GIT_CHECKOUT_BRANCH --seq 7 --status completed --durationMs <duration> \
     --message "Created feature branch feat/<app-id>"
   ```
2. **Stage and commit app files ONLY** (index.html, meta.json, thumbnail.svg).
   - Execute: `git add` and `git commit` (capture commit SHA)
   - **LOG IMMEDIATELY:**
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --category pipeline \
     --step GIT_COMMIT --seq 8 --status completed --durationMs <duration> \
     --message "Committed app files (sha: <COMMIT_SHA>)"
   ```
   - **Do NOT commit log.jsonl yet** — it will be finalized in Step 9 after all transactions complete.

### Step 8: PR flow (seq 9-13)
**Pattern: Execute → Log immediately → Move to next**

1. Execute: Push branch: `git push -u origin feat/<app-id>`
   - **LOG IMMEDIATELY:**
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --category pipeline \
     --step GIT_PUSH --seq 9 --status completed --durationMs <duration> \
     --message "Pushed feature branch to origin"
   ```
2. Execute: Create PR: `gh pr create --title "..." --body "..."`
   - **LOG IMMEDIATELY:**
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --category pipeline \
     --step CREATE_PR --seq 10 --status completed --durationMs <duration> \
     --message "Created PR #<NUMBER> for feat/<app-id>"
   ```
3. Execute: Self-review PR (check code quality, tests, etc.)
   - **LOG IMMEDIATELY:**
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --category pipeline \
     --step PR_REVIEW --seq 11 --status completed --durationMs <duration> \
     --message "PR review complete - code quality good"
   ```
4. Execute: `npm run generate:apps` (update registry before merge, so registry and app deploy together)
   - **LOG IMMEDIATELY:**
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --category pipeline \
     --step UPDATE_REGISTRY --seq 12 --status completed --durationMs <duration> \
     --message "Updated app registry with new app metadata"
   ```
5. Execute: Merge PR with squash: `gh pr merge <pr-number> --squash --auto`
   - **LOG IMMEDIATELY:**
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --category pipeline \
     --step MERGE_PR_DEPLOY --seq 13 --status completed --durationMs <duration> \
     --message "PR merged to main and Vercel deployment triggered"
   ```
   - Wait ~2–3 minutes for Vercel auto-deployment to complete (webhook triggered automatically on main merge)
6. Verify merge on main: `git checkout main && git pull origin main`
7. Verify app is live in public folder and accessible
8. Execute: Delete the feature branch (local and remote)
   - `git branch -d feat/<app-id>`  # Delete local branch
   - `git push origin --delete feat/<app-id>`  # Delete remote branch
   - **LOG IMMEDIATELY:**
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --category pipeline \
     --step DELETE_BRANCH --seq 14 --status completed --durationMs <duration> \
     --message "Deleted feature branch feat/<app-id>"
   ```

### Step 9: Finalize transaction log and commit (finalization)
After all logging transactions are complete (Steps 1-14), perform the final log entry and commit:
1. Log the `TRANSACTION_END` using npm run log:
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --category pipeline \
     --step TRANSACTION_END --status success --durationMs <total_duration> \
     --message "App generation pipeline complete"
   ```
   This appends TRANSACTION_END to both `apps/YYYY/MM/DD/<app-id>/log.jsonl` and `logs/YYYY/MM/DD.jsonl`.

2. **This is the FINAL COMMIT:** Verify all 14 logging entries are in the log file, then commit:
   ```bash
   git add apps/YYYY/MM/DD/<app-id>/log.jsonl
   git commit -m "chore: finalize transaction log for <app-id> [skip deploy]"
   ```
   - **MUST include `[skip deploy]` in commit message** — tells Vercel not to redeploy (log.jsonl is metadata only, app is already deployed as part of Step 13 MERGE_PR_DEPLOY)
3. **Push this commit directly to the main branch:** `git push origin main`

> **⚠️ CRITICAL WARNING:** If `[skip deploy]` is omitted from the commit message, Vercel will trigger an unnecessary rebuild/redeploy cycle. ALWAYS verify the commit message contains `[skip deploy]` before pushing.

