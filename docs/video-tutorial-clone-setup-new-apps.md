# Video Tutorial Script: Clone, Set Up, And Create Apps

Target length: 12-16 minutes

Audience: developers or AI-agent users who want to run Valley of AI locally and start adding
self-contained mini-apps.

## Recording Setup

- Record at 1920x1080 or 2560x1440 with browser and terminal large enough to read.
- Use a clean desktop, a fresh terminal, and a browser open to the GitHub repo.
- Keep secrets out of frame. When editing `.env`, show `.env.example` first, then blur or skip
  real values.
- Use zoom-ins for terminal commands, `apps/YYYY/MM/DD/<app-id>/`, and the app preview.
- Recommended windows: browser on the left or full-screen for GitHub/local app, terminal and
  editor full-screen for setup and code.

## Chapter 1: What We Are Building

Visuals:

- Open `https://www.valleyofai.com`.
- Scroll through the gallery.
- Open one existing app.
- Cut to the GitHub repository README.

Narration:

> In this video, I am going to clone Valley of AI from scratch, run it locally, and show how new
> AI-built apps fit into the project. Valley of AI is a Next.js gallery, but each playable app is a
> self-contained static bundle: plain HTML, CSS, JavaScript, metadata, a thumbnail, and logs.

On-screen callout:

```text
Main site: Next.js
Mini-apps: apps/YYYY/MM/DD/<app-id>/
```

## Chapter 2: Prerequisites

Visuals:

- Show README prerequisites section.
- Open terminal and run each version check.

Terminal commands to record:

```bash
node --version
npm --version
git --version
gh --version
```

Optional validation tooling:

```bash
npx playwright --version
supabase --version
xmllint --version
```

Narration:

> You need Node.js 18 or newer, npm 9 or newer, git, and the GitHub CLI. For full validation,
> install the Playwright Chromium browser. Supabase is needed if you are setting up votes,
> leaderboards, or migrations for your own hosted instance.

On-screen callout:

```text
Required for local dev: Node 18+, npm 9+, git
Useful for pipeline work: gh, Playwright Chromium, Supabase CLI
```

## Chapter 3: Clone The Repo

Visuals:

- Show GitHub repo URL.
- Copy the clone URL.
- Switch to terminal.

Terminal commands to record:

```bash
git clone https://github.com/jeffholst/valley-of-ai.git
cd valley-of-ai
git status --short
```

Narration:

> First, clone the repo and move into the project folder. I like to run `git status --short`
> immediately so I know I am starting from a clean checkout.

Visual guidance:

- Zoom in on the empty `git status --short` output.
- Briefly show the project tree in the editor.

## Chapter 4: Install Dependencies

Visuals:

- Terminal full-screen.
- Keep command output visible, but speed up long install footage.

Terminal commands to record:

```bash
npm install
npx playwright install chromium
```

Narration:

> Now install the Node dependencies. The responsive validation scripts use Playwright, so install
> Chromium once after the dependency install. If you only want to run the gallery locally, the first
> command is the important one. If you plan to validate app changes, install Chromium too.

On-screen callout:

```text
npm install
npx playwright install chromium
```

## Chapter 5: Environment File

Visuals:

- Open `.env.example` in the editor.
- Run the copy command.
- Open `.env`, but do not show real secret values.

Terminal command to record:

```bash
cp .env.example .env
```

Narration:

> Next, create a local environment file. For a full hosted instance, you will fill in Supabase,
> analytics, Turnstile, and Stripe values. For a basic local walkthrough, you can create the file
> now and come back to real service keys later.

Visual guidance:

- Show `.env.example` instead of real secrets.
- If showing `.env`, keep values blank, fake, or blurred.

On-screen callout:

```text
Never commit .env or .env.local
Only NEXT_PUBLIC_* values are safe for browser exposure
```

## Chapter 6: Start The Dev Server

Visuals:

- Terminal runs the dev command.
- Browser opens `http://localhost:3000`.
- Show gallery loading locally.

Terminal command to record:

```bash
npm run dev
```

Narration:

> Start the development server. This project runs a sync step first, then starts Next.js. The sync
> step copies the static apps into `public/` and replaces app-shell placeholders for local serving.

Browser URL:

```text
http://localhost:3000
```

Visual guidance:

- Show the terminal line that says the local server is ready.
- Open the local gallery.
- Click into one app and show that the shared header and footer appear.

## Chapter 7: Quick Project Tour

Visuals:

- Editor sidebar with top-level folders.
- Briefly click each relevant folder.

Narration:

> The Next.js site lives in `app/`, shared UI lives in `components/`, and tests live in
> `__tests__/`. The important folder for new mini-apps is `apps/`. Each app is stored by date,
> then by app id. The committed gallery registry is `data/apps.json`, and it is regenerated from
> app metadata.

On-screen folder map:

```text
app/                  Next.js routes
components/           Shared React UI
apps/                 Static mini-app source bundles
apps/shared/          Shared shell injected into apps
data/apps.json        Committed gallery registry
pipelines/prompts/    Agent workflow prompts
```

## Chapter 8: How A New App Is Structured

Visuals:

- Open an existing app folder under `apps/YYYY/MM/DD/<app-id>/`.
- Show `index.html`, `meta.json`, `thumbnail.svg`, and `log.jsonl`.

Narration:

> A mini-app is deliberately simple. It is a static bundle with `index.html`, `meta.json`,
> `thumbnail.svg`, and a `log.jsonl` pipeline log. The app itself should be self-contained HTML,
> CSS, and JavaScript. Do not add a separate app-specific build step.

On-screen callout:

```text
Required app files:
index.html
meta.json
thumbnail.svg
log.jsonl
```

Visual guidance:

- Open `index.html` and highlight the shared shell script:

```html
<script src="/apps/shared/app-shell.js" defer></script>
```

- Highlight the placeholder tokens:

```html
__GA_MEASUREMENT_ID__ __MAIN_SITE_URL__ __MAIN_SITE_NAME__
```

Narration:

> Every app uses the shared shell. That shell injects the site header, footer, theme behavior,
> analytics hooks, and sharing helpers. Keep the placeholder tokens as placeholders. The sync and
> build steps replace them from the environment.

## Chapter 9: Create A New App With The Agent Pipeline

Visuals:

- Open `pipelines/prompts/shared.md`.
- Open `pipelines/prompts/new-app.md`.
- Show the pipeline step table.
- Show GitHub issues or the local terminal command.

Narration:

> The normal production workflow is agent-driven. The agent reads `pipelines/prompts/shared.md`
> first, then `pipelines/prompts/new-app.md`. It selects an approved suggestion, checks guardrails,
> creates the app folder, builds the static app, creates metadata and a thumbnail, validates it,
> opens a PR, and logs each step.

Terminal command to show:

```bash
npm run select:app:suggestion
```

On-screen callout:

```text
Pipeline context:
1. pipelines/prompts/shared.md
2. pipelines/prompts/new-app.md
```

Narration:

> If you are using an AI coding agent, give it those two prompt files as context and ask it to run
> the new-app pipeline. Pending GitHub issues must be reviewed before they can be selected, so this
> command only consumes approved suggestions.

Visual guidance:

- Do not spend time on every pipeline detail.
- Emphasize the two prompt files and the `apps/YYYY/MM/DD/<app-id>/` output.

## Chapter 10: Create A Tiny Demo App Manually

Visuals:

- Stop or keep the dev server running in one terminal.
- Open a second terminal.
- Create a tutorial branch.
- Create a date-based folder.

Terminal commands to record:

```bash
git checkout -b feat/tutorial-demo-app
mkdir -p apps/2026/04/27/tutorial-demo-app
```

Narration:

> To understand the shape of an app, I am going to make a tiny manual demo. In real project work,
> the agent pipeline handles this with logs and richer validation, but the file layout is the same.

Visual guidance:

- Use the current recording date in the folder path.
- Name the app id in kebab case.

Create `apps/2026/04/27/tutorial-demo-app/index.html`.

Show these required pieces:

```html
<title>Tutorial Demo App - __MAIN_SITE_NAME__</title>
<meta name="application-name" content="Tutorial Demo App" />
<meta name="voa-app-id" content="2026/04/27/tutorial-demo-app" />
<script src="/apps/shared/app-shell.js" defer></script>
```

Narration:

> The title format matters, the `voa-app-id` should match the folder path, and the shared shell
> script should stay in place. For styling, support both the default theme and
> `[data-theme='light']`.

Visual guidance:

- Show a minimal interactive app, such as a counter, color mixer, timer, or small game.
- Keep all HTML, CSS, and JavaScript in `index.html`.
- Make sure controls are below the fixed header and above the fixed footer.

On-screen layout note:

```text
Shared shell safe zones:
Header: 64px
Footer: 56px
Keep controls between them
```

Create `apps/2026/04/27/tutorial-demo-app/meta.json`.

Show the fields:

```json
{
  "id": "tutorial-demo-app",
  "name": "Tutorial Demo App",
  "shortDescription": "A small local demo app for learning the Valley of AI app format.",
  "thumbnail": "thumbnail.svg",
  "createdAt": "2026-04-27T00:00:00Z",
  "category": "Education",
  "status": "experimental",
  "tags": ["tutorial", "demo"],
  "homepagePath": "index.html",
  "inputMode": "responsive",
  "generation": {
    "runId": "run-20260427T000000Z-demo00",
    "agent": "manual tutorial",
    "llmModel": "manual tutorial",
    "startedAt": "2026-04-27T00:00:00Z",
    "completedAt": "2026-04-27T00:00:00Z",
    "durationSeconds": 0,
    "tokensIn": 0,
    "tokensOut": 0,
    "notes": "Tutorial demo created manually for local learning."
  }
}
```

Create `thumbnail.svg`.

Narration:

> Metadata drives gallery display and registry generation. The thumbnail must be an SVG with a
> `viewBox` of `0 0 800 450`. For production apps, make the thumbnail visually describe the app,
> not just a generic title card.

On-screen callout:

```text
thumbnail.svg requirement:
viewBox="0 0 800 450"
```

## Chapter 11: Regenerate And Validate

Visuals:

- Terminal full-screen.
- Run generation and validation commands.
- Show `data/apps.json` changing in the editor or git diff.

Terminal commands to record:

```bash
npm run generate:apps
npm run validate:apps
```

Optional broader checks:

```bash
npm run lint
npm test
npm run build
```

Narration:

> Whenever app metadata changes, regenerate the committed app registry. Then validate the app
> contracts. Before opening a real PR, run lint, tests, and a production build. For app-heavy
> changes, also run the responsive validation sample.

Optional app validation:

```bash
npm run validate:responsive:sample
```

Visual guidance:

- If validation fails, show one example of reading the error and fixing it.
- If it passes, zoom in on the success message.

## Chapter 12: Preview The New App Locally

Visuals:

- If the dev server is not running, start it again.
- Browser opens local gallery.
- Search or scroll for the demo app.
- Open the app.

Terminal command:

```bash
npm run dev
```

Browser URL:

```text
http://localhost:3000
```

Narration:

> After regenerating the registry, the app appears in the local gallery. Open it and check the
> basics: it loads without console errors, the shared shell appears, the layout works on mobile and
> desktop widths, and the controls are not hidden behind the fixed header or footer.

Visual guidance:

- Open browser dev tools console briefly.
- Toggle mobile viewport.
- Click the app controls.
- Toggle light/dark theme if visible.

## Chapter 13: Commit And PR

Visuals:

- Terminal shows exact files changed.
- Stage explicit files.
- Commit.

Terminal commands:

```bash
git status --short
git add apps/2026/04/27/tutorial-demo-app/index.html
git add apps/2026/04/27/tutorial-demo-app/meta.json
git add apps/2026/04/27/tutorial-demo-app/thumbnail.svg
git add data/apps.json
git commit -m "feat: add tutorial demo app [skip deploy]"
```

Narration:

> Stage files explicitly. For app pipeline commits, include `[skip deploy]` when appropriate so the
> deployment flow can be controlled separately. In production pipeline runs, the agent also creates
> logs, opens the PR, and handles the issue labels.

Visual guidance:

- Show `git status --short` before and after staging.
- Avoid `git add .` in the video.

Optional PR command:

```bash
gh pr create --fill
```

## Chapter 14: Wrap Up

Visuals:

- Return to local gallery with the app open.
- Show README commands table or `package.json` scripts.

Narration:

> That is the full loop: clone the repo, install dependencies, create the environment file, run the
> dev server, understand the static app structure, create or generate a new app, regenerate
> `data/apps.json`, validate, preview, and commit. For real new apps, use the agent pipeline with
> `shared.md` and `new-app.md`. For learning, a manual mini-app is the fastest way to understand
> the contract.

Final on-screen checklist:

```text
Clone:
git clone https://github.com/jeffholst/valley-of-ai.git

Install:
npm install
npx playwright install chromium

Run:
cp .env.example .env
npm run dev

New app:
apps/YYYY/MM/DD/<app-id>/
npm run generate:apps
npm run validate:apps
```

## B-Roll And Editing Notes

- Add chapter cards for each major section.
- Use terminal zooms for commands and successful output.
- Use quick cuts for long installs and builds.
- Add a warning overlay whenever `.env` is visible.
- Add a side-by-side shot of `meta.json` and the app card in the gallery to connect metadata to
  what users see.
- Include one mobile viewport check near the end to reinforce responsive expectations.

## Common Mistakes To Mention Briefly

- Forgetting to run `npm run generate:apps` after changing `meta.json`.
- Removing the shared shell script from `index.html`.
- Replacing `__PLACEHOLDER__` values manually instead of letting sync/build handle them.
- Putting app controls behind the fixed header or footer.
- Creating a thumbnail without `viewBox="0 0 800 450"`.
- Staging unrelated files with `git add .`.
