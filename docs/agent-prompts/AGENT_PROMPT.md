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
- File paths: `apps/YYYY/MM/DD/<app-id>/` (for index.html, thumbnail.svg, meta.json)
- `meta.json`: `createdAt`, `generation.startTime`, `generation.endTime`
- `runId` timestamp portion
- All logging timestamps (handled automatically by `npm run log`)

### Model Reporting
⚠️ Make your best effort to report your agent name correctly AND the LLM being used.

### Required app files
```
apps/YYYY/MM/DD/<app-id>/
  index.html
  log.jsonl // created by 'npm run log'
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

<meta name="voa-main-site-url" content="__MAIN_SITE_URL__" />
<meta name="voa-main-site-name" content="__MAIN_SITE_NAME__" />
<meta name="voa-github-url" content="__GITHUB_URL__" />
<meta name="voa-social-x-url" content="__SOCIAL_X_URL__" />
<meta name="voa-social-facebook-url" content="__SOCIAL_FACEBOOK_URL__" />
<meta name="voa-social-instagram-url" content="__SOCIAL_INSTAGRAM_URL__" />
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
All logging is handled by `npm run log`. Each app run is one transaction (TRANSACTION_START → STEP entries → TRANSACTION_END).

**⚠️ CRITICAL: npm run log automatically creates TWO log files:**
- `apps/YYYY/MM/DD/<app-id>/log.jsonl` — app-local transaction log
- `logs/YYYY/MM/DD.jsonl` — central consolidated log for all apps created that day

**BOTH files are automatically created by every `npm run log` call and MUST be committed to git and included in the PR and main branch merge.**

**To keep `YYYY/MM/DD` in sync across generated files and logs:**
- Derive `YYYY/MM/DD` once in Step 0 from the initial UTC timestamp.
- Reuse that exact value for the app folder path and for every `npm run log` call via `--date YYYY/MM/DD`.
- Do not recompute the date later in the run.

### ⚠️ CRITICAL: REAL-TIME LOGGING (DO NOT SKIP)
**This rule is non-negotiable and must be followed exactly:**

1. Create the app folder `apps/YYYY/MM/DD/<app-id>` **before any logging begins** so `log.jsonl` can be created by `npm run log`.
2. **After EVERY step completes (Steps 1-14), immediately call `npm run log` to write the log entry.**
3. **Execution pattern (MANDATORY):**
   - Execute step (validate, git command, PR, merge, deploy, etc.)
  - Immediately call `npm run log` so the entry is written to the app-local and central log files (within seconds, not later)
   - Move to next step
   - **DO NOT batch logs at the end. DO NOT skip logging any step.**

**Failure consequence:** Missing logs = incomplete transaction records = pipeline audit trail is broken. This defeats the purpose of the transaction log.

**Implementation:** Use the step-specific `npm run log` commands shown throughout this prompt.

For reasoning decisions and validation checks, use `--category reasoning` or `--category validation` as shown in Steps 1, 2, and 6.

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
3. Derive `YYYY/MM/DD` from the timestamp.
4. Generate `runId` in format: `run-YYYYMMDDTHHMMSSZ-<6-char-hex>`.

> **Note:** Do NOT create the app folder yet — `<app-id>` is not known until Step 1.

### Step 1: Idea selection
1. Review `data/apps.json` to check the current app registry and avoid starting a duplicate or near-duplicate app.
2. Check for approved community suggestions:
   ```bash
   gh issue list --label "status:approved" --state open --json number,title,body,url --limit 5
   ```
   - If one or more approved issues are returned, pick the most suitable one. Note its `number`, `url`, and extract the description from the issue `body` (the text under `### Description`). Also extract the requestor name from the `**Requestor:**` line if present.
   - If no approved issues exist, proceed with a freely chosen concept.
3. Choose one app concept and category. Derive `<app-id>` as a kebab-case slug (e.g., `color-match-blitz`).
4. ⚠️ Create the app folder: `apps/YYYY/MM/DD/<app-id>/`.
5. Log the transaction start (this creates both log files):
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category pipeline \
     --step TRANSACTION_START --status completed --message "Starting app generation pipeline"
   ```
   This automatically creates both:
   - `apps/YYYY/MM/DD/<app-id>/log.jsonl` (app-local log)
   - `logs/YYYY/MM/DD.jsonl` (central daily log)

   **These files will be committed in Step 9 after the pipeline completes.**
6. Log `SELECT_SUGGESTION`:
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category pipeline \
     --step SELECT_SUGGESTION --seq 1 --status completed --durationMs <duration> \
     --tokensIn <in> --tokensOut <out> \
     --message "Selected [app-name] concept in [category]"
   ```
7. Optionally log reasoning (why this app over alternatives):
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category reasoning \
     --phase SELECT_SUGGESTION --message "Why this app was chosen" \
     --decision "<app-name>" --alternatives "alt1,alt2,alt3" \
     --rationale "Reason for choice: good learning opportunity, unique mechanics, etc."
   ```

### Step 2: Research
1. Do brief targeted research for mechanics + UX.
2. Capture 2-3 inspirations and one unique angle.
3. Log `RESEARCH_IDEAS`:
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category pipeline \
     --step RESEARCH_IDEAS --seq 2 --status completed --durationMs <duration> \
     --tokensIn <in> --tokensOut <out> \
     --message "Research complete: [mechanic summary]"
   ```
4. Optionally log reasoning about design choices:
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category reasoning \
     --phase RESEARCH_IDEAS --message "Design decision rationale" \
     --decision "chosen-mechanic" --alternatives "alt-mechanic1,alt-mechanic2" \
     --rationale "Why this mechanic: proven engagement, good learning curve, fits constraints"
   ```

### Step 3: Generate app
Generate `index.html` with shell config tags, mobile-first responsive design, and favicon reference.

**⚠️ Important: Shared Shell Runtime Environment**

The app shell automatically injects a header and footer at runtime. Account for this in your layout:
- **Header**: Added at the top (contains theme toggle, back link, navigation)
- **Footer**: Added at the bottom (contains site info, version, social links)
- **Container**: Your app content is placed in the middle
- **Layout consideration**: Ensure your app content is scrollable or that key interactive controls are visible without scrolling, especially on small screens (320px width). If the screen height is constrained and your content + header + footer exceeds the viewport, controls must not be hidden below the fold in a non-scrollable container.

Quality standards (non-negotiable):
- **Visually polished**: smooth CSS transitions/animations, consistent spacing, cohesive color palette
- **Mobile-first**: layout works at 320px wide, touch targets ≥ 44px, no horizontal scroll
- **Scrollable or contained**: ensure primary controls and game/tool interaction area are accessible without scrolling on small screens, OR make content properly scrollable
- **Immediately usable**: no loading spinners or setup required — game/tool is ready on first render
- **Accessible**: semantic HTML, sufficient color contrast, keyboard navigable
- **No JS errors**: console clean on load and during use
- **If a game**: clear score display, win/loss/restart states all implemented and functional

Log immediately:
```bash
npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category pipeline \
  --step GENERATE_HTML --seq 3 --status completed --durationMs <duration> \
  --tokensIn <in> --tokensOut <out> \
  --message "Generated index.html with responsive layout"
```

### Step 4: Generate thumbnail
Generate `thumbnail.svg` (viewBox="0 0 800 450") matching the app's UI, colors, and state.

#### Thumbnail requirements

**Canvas**
- `viewBox="0 0 800 450"` — exactly this, no other size. Verify it before saving.
- Fill the entire canvas. A sparse or mostly-empty thumbnail is a failure.
- No `<animate>` tags. The SVG renders statically — animations are ignored and waste space.
- All `<defs>` (gradients, filters) must be declared at the top, before any use.
- The background `<rect>` must have explicit `x="0" y="0" width="800" height="450"` attributes.

**SVG/XML validity (required — invalid XML will not render)**
- Never use `--` inside XML comments. This is illegal XML and will cause a parse error. This commonly occurs when labeling morse code, scores, or other content that uses dashes (e.g. `<!-- O  ---  -->` is invalid). Use plain English descriptions instead: `<!-- O: three dashes -->`.
- Run `xmllint --noout thumbnail.svg` before saving to confirm the file is valid XML. If xmllint is unavailable, carefully review all comments for double hyphens.
- Avoid `feDropShadow` — use `feGaussianBlur` + `feMerge` instead for broader renderer support.

**Show a mid-use state, not a start screen**
- Games: player is mid-action, obstacles present, score > 0, lives/progress visible
- Tools: populated with realistic data/content, not blank defaults
- The user should instantly understand what the app does just by looking at the thumbnail

**Must include all of these:**
- Background matching the app's background color/gradient (never plain white or default gray)
- The app's primary interactive element(s) drawn accurately (game board, cards, canvas, etc.)
- HUD or UI chrome that mirrors the real app: score, level, lives, timer, toolbar buttons, etc.
- The app name displayed prominently using a font style and color that matches the app's visual identity
- At least one `<linearGradient>` or `<radialGradient>` — flat fills look cheap
- At least one `<filter>` effect (glow, drop shadow, blur) for visual polish

**Match the app exactly**
- Use the same CSS color values as defined in `index.html` — no generic blues or purples
- Font family should match (monospace for retro/tech, serif for card games, etc.)
- Layout zones (where the game area is, where the HUD is) must match the real app layout

**Polish checklist**
- Corner accents or edge glow to frame the composition
- Background depth: use a gradient or subtle grid/texture, not a flat fill
- Title text uses a glow or shadow filter, not plain flat text
- No placeholder geometry (unlabeled rectangles, meaningless lines)

Log immediately:
```bash
npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category pipeline \
  --step GENERATE_THUMBNAIL --seq 4 --status completed --durationMs <duration> \
  --tokensIn <in> --tokensOut <out> \
  --message "Generated thumbnail.svg"
```

### Step 5: Metadata
Generate `meta.json` with all required fields: `id`, `name`, `shortDescription`, `thumbnail`, `createdAt`, `category`, `status`, `tags`, `homepagePath`, `inputMode`, `generation` (include agentName, llmModel, startTime, endTime, totalTokensIn/Out, runId, notes).

If this app was built from an approved GitHub Issue (Step 1), also include a `suggestion` object:
```json
"suggestion": {
  "issueNumber": <number>,
  "issueUrl": "<full GitHub issue URL>",
  "prompt": "<original description text from the issue body>",
  "requestor": "<requestor name, or omit field if anonymous>"
}
```

> **Note on `generation.endTime`:** Set it to your best estimate at this step. It will not be exact since the pipeline hasn't completed yet — that is acceptable. Do not leave it blank.

Log immediately:
```bash
npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category pipeline \
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

Run (in order): ⚠️ do not write any output files that would corrupt repo 
- `npm run generate:apps` — generates new `data/apps.json` 
- `npm run validate:apps` — confirms all required app files exist, metadata is valid, and committed `data/apps.json` is synchronized
- `npm run lint:fix` — auto-fix any lint issues first
- `npm run format` — apply Prettier formatting (100-char, single quotes, 2-space indentation)
- `npm run lint` — must pass with 0 errors, 0 warnings
- `npm test` — all test suites must pass
- `npm run validate:responsive:sample` — confirms responsive layout passes (sample check)
- `npm run build` — must complete successfully


If validation fails:
- fix issues,
- log failed/retrying/completed statuses accordingly,
- do not continue until passing.

When passed, log validation checks and pipeline step:
```bash
# Example 1: Validation check - file exists
npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category validation \
  --checkType "file-exists" --name "index.html" --result PASS \
  --message "HTML file created and readable"

# Example 2: Validation check - tests pass
npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category validation \
  --checkType "test-pass" --name "npm test" --result PASS \
  --message "All test suites passing"

# Example 3: Pipeline step completion
npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category pipeline \
  --step VALIDATE_APP --seq 6 --status completed --durationMs <duration> \
  --message "All validation checks passed"
```

### Step 7: Git branch and commit (seq 7-8)
**Pattern: Execute → Log immediately → Move to next**

1. Execute: `git checkout -b feat/<app-id>`
   - **Log immediately:**
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category pipeline \
     --step GIT_CHECKOUT_BRANCH --seq 7 --status completed --durationMs <duration> \
     --message "Created feature branch feat/<app-id>"
   ```

2. **Stage and commit app files ONLY** (index.html, meta.json, thumbnail.svg). Use explicit paths — do NOT use `git add .` or `git add -A` here, as `log.jsonl` is intentionally deferred to Step 9.
   - Execute:
   ```bash
   git add apps/YYYY/MM/DD/<app-id>/index.html \
           apps/YYYY/MM/DD/<app-id>/thumbnail.svg \
           apps/YYYY/MM/DD/<app-id>/meta.json \
           data/apps.json

   git commit -m "feat: add <app-id> [skip-deploy]"
   ```
  - **MUST include `[skip deploy]` in commit message** — tells Vercel not to redeploy

   - Capture the commit SHA from the output.
   - **Log immediately:**
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category pipeline \
     --step GIT_COMMIT --seq 8 --status completed --durationMs <duration> \
     --message "Committed app files (sha: <COMMIT_SHA>)"
   ```
   - **Do NOT commit `apps/YYYY/MM/DD/<app-id>/log.jsonl` or `logs/YYYY/MM/DD.jsonl` yet** — both will be finalized and committed in Step 9 after all pipeline transactions complete.

### Step 8: PR flow (seq 9-13)
**Pattern: Execute → Log immediately → Move to next**

1. Execute: Push branch: `git push -u origin feat/<app-id>`
   - **Log immediately:**
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category pipeline \
     --step GIT_PUSH --seq 9 --status completed --durationMs <duration> \
     --message "Pushed feature branch to origin"
   ```
2. Execute: Create PR: `gh pr create --title "..." --body "..."`
   - **Log immediately:**
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category pipeline \
     --step CREATE_PR --seq 10 --status completed --durationMs <duration> \
     --message "Created PR #<NUMBER> for feat/<app-id>"
   ```
3. Execute: Self-review PR (check code quality, tests, etc.)
   - **Log immediately:**
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category pipeline \
     --step PR_REVIEW --seq 11 --status completed --durationMs <duration> \
     --message "PR review complete - code quality good"
   ```
4. Execute: Merge PR with squash: `gh pr merge <pr-number> --squash --auto`
   - `--auto` queues the merge once all required checks pass. Confirm it actually merged:
   ```bash
   gh pr view <pr-number> --json state,mergeStateStatus
   ```
   If `state` is not `MERGED` after 2–3 minutes, check for failing checks or branch protection rules before continuing.
   - **Log immediately after confirmed merge:**
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category pipeline \
     --step MERGE_PR_DEPLOY --seq 13 --status completed --durationMs <duration> \
     --message "PR merged to main and Vercel deployment triggered"
   ```
   - Wait ~2–3 minutes for Vercel auto-deployment to complete (webhook triggered automatically on main merge)
5. Verify merge on main: `git checkout main && git pull origin main`
6. Verify app files are present: confirm `apps/YYYY/MM/DD/<app-id>/index.html` exists in the working tree
7. Execute: Delete the feature branch (local and remote)
   - `git branch -d feat/<app-id>`  # Delete local branch
   - `git push origin --delete feat/<app-id>`  # Delete remote branch
   - **Log immediately:**
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category pipeline \
     --step DELETE_BRANCH --seq 14 --status completed --durationMs <duration> \
     --message "Deleted feature branch feat/<app-id>"
   ```

### Step 9: Finalize transaction log and commit (finalization)
After all logging transactions are complete (Steps 1-14), perform the final log entry and commit:
1. **Confirm you are on the main branch** before committing:
   ```bash
   git branch --show-current  # must output: main
   ```
   If not on main: `git checkout main && git pull origin main`

2. Log the `TRANSACTION_END` using npm run log:
   ```bash
   npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --category pipeline \
     --step TRANSACTION_END --status success --durationMs <total_duration> \
     --message "App generation pipeline complete"
   ```
   This appends `TRANSACTION_END` to both `apps/YYYY/MM/DD/<app-id>/log.jsonl` and `logs/YYYY/MM/DD.jsonl`.

3. **If this app was built from a GitHub Issue suggestion**, close the issue and mark it implemented:
   ```bash
   gh issue edit <issue-number> --add-label "status:implemented" --remove-label "status:approved" --remove-label "status:pending"
   gh issue close <issue-number> --comment "Built as [<app-name>](/apps/YYYY/MM/DD/<app-id>). Thanks for the suggestion!"
   ```

4. **This is the FINAL COMMIT:** Verify all 16 log entries are present (TRANSACTION_START + seq 1–14 + TRANSACTION_END) in BOTH log files, then commit both:
    ```bash
    git add apps/YYYY/MM/DD/<app-id>/log.jsonl logs/YYYY/MM/DD.jsonl
    git commit -m "chore: finalize transaction logs for <app-id>"
    ```
   - **CRITICAL:** Both files MUST be committed together:
     - `apps/YYYY/MM/DD/<app-id>/log.jsonl` — app-local transaction record
     - `logs/YYYY/MM/DD.jsonl` — central consolidated log entry
4. **Push this commit directly to the main branch:** `git push origin main`
