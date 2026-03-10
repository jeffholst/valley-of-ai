# OpenClaw App Showcase – Product Specification

## 1. Problem statement

OpenClaw can autonomously generate new applications on a recurring basis, but there is currently no cohesive, public‑facing way to browse, rank, and interact with these artifacts in one place.  
A dedicated showcase application will act as a living gallery of what an AI development agent can build from minimal prompts, with both the showcase UI and the generated apps co‑located in a single GitHub repository and deployed to GitHub Pages at zero hosting cost.

## 2. Goals

- Provide a **beautiful**, engaging gallery that highlights nightly OpenClaw‑generated apps, optimized for visual appeal and ease of browsing for technical and non‑technical visitors.  
- Co‑locate the showcase shell and all generated apps in one GitHub repo so the OpenClaw agent can fully manage the portfolio (add, update, archive apps) via commits, without any external admin UIs or databases.  
- Enable simple community voting to surface the most popular apps, with client‑side sorting and filtering by creation date and rating.  
- Offer a low‑friction suggestion channel where users can submit ideas for new apps directly within the web UI.  
- Capture and expose metadata about each app generation (LLM used, agent, timings, token usage, run ID) for transparency and debugging.  
- Keep hosting free and simple by serving the entire site as a static React app on GitHub Pages, with automated build and deploy on every push to `main`.

***

## 3. Scope

### In scope

- Public showcase site listing all generated apps as cards.  
- App detail pages that allow visitors to launch or explore individual apps.  
- Web‑based suggestion form for new app ideas.  
- Web‑based voting UI for “most popular” apps.  
- Git‑backed data model using JSON files and predictable folder structure.  
- Automated CI/CD via GitHub Actions to build and deploy to GitHub Pages on each push to `main`.  
- Logging of all OpenClaw actions into the repository, including generation metadata.

### Out of scope (for now)

- Email‑based submissions or voting.  
- Authenticated user accounts or per‑user vote tracking.  
- Complex moderation tools beyond manual review of suggestions and app metadata.  
- Multi‑repo app hosting; everything lives in a single repo.

***

## 4. Target users

- Curious developers, product managers, and AI enthusiasts who want a concrete, visual sense of what an autonomous AI dev agent can build with minimal input.  
- Casual visitors arriving from social links or a main SaaS site who prefer a polished, gallery‑style experience over raw code repositories.

***

## 5. Key use cases

- A user lands on the showcase, browses the grid of apps, sorts by “Highest rated,” clicks into an app, and explores it live, then returns via in‑app navigation to try more apps.  
- A user with an idea opens the suggestion form, submits an app concept, and later sees their idea realized as a new card in the showcase after a nightly OpenClaw build run.  
- A user finds a favorite app and clicks an up‑vote button, incrementing its popularity so it rises in the “Highest rated” view.  
- A maintainer inspects an app’s detail or metadata to see which agent and LLM produced it, when it was generated, and roughly how many tokens were used.

***

## 6. Tech stack and constraints

- Front‑end: React (modern functional components and hooks).  
- Styling: Tailwind CSS, with first‑class support for both dark and light modes.  
- Hosting: GitHub Pages, using a static build of the React app.  
- CI/CD: GitHub Actions workflow that installs dependencies, builds the app, and deploys the `build` output to GitHub Pages on every push to `main`.  
- Routing: React Router (or equivalent), configured to be compatible with GitHub Pages (e.g., hash router or appropriate `basename`).  
- No server‑side database; persistent content is stored as JSON and static assets in the Git repository.  
- All administration is Git‑driven: changes are performed via commits and pull requests, primarily by the OpenClaw agent.

***

## 7. Repository and folder structure

The repository serves as both the codebase and the system of record for all apps, suggestions, and logs.

### 7.1 High‑level layout

```text
/
  src/                  # React showcase app source
  public/               # Static assets for the showcase shell
  apps/                 # Generated apps organized by date and id
  suggestions/          # Stored suggestion JSON files
  logs/                 # Agent action logs (append-only)
  scripts/              # Build utility scripts (e.g., registry generator)
  package.json
  tailwind.config.js
  postcss.config.js
  .github/workflows/deploy.yml
```

### 7.2 Apps directory

- All generated apps live under `/apps`.  
- Apps are organized by `year/month/day/app-id` to reflect when OpenClaw built them.  
- Each app has its own folder with code/assets and a `meta.json` file.

Example:

```text
/apps
  /2026
    /03
      /05
        /markdown-notes
          meta.json
          thumbnail.png
          index.html        # or React entry point
          ...               # app-specific files
        /pomodoro-timer
          meta.json
          thumbnail.png
          ...
      /06
        /todo-kanban
          meta.json
          ...
```

***

## 8. Data model and file conventions

The repository is the single source of truth for all app metadata and suggestions.

### 8.1 App meta `meta.json`

Each app folder contains a `meta.json` file that drives the card grid, app detail view, and exposes generation metadata.

Example:

```json
{
  "id": "markdown-notes",
  "name": "Markdown Notes",
  "shortDescription": "A minimalist markdown note-taking app with live preview.",
  "thumbnail": "thumbnail.png",
  "createdAt": "2026-03-05T02:30:00Z",
  "category": "Productivity",
  "votes": 0,
  "status": "active",
  "tags": ["notes", "markdown"],
  "homepagePath": "index.html",
  "generation": {
    "agentName": "openclaw-dev-agent",
    "llmModel": "gpt-5.1",
    "startTime": "2026-03-05T03:21:45Z",
    "endTime": "2026-03-05T03:22:10Z",
    "totalTokensIn": 4200,
    "totalTokensOut": 3100,
    "runId": "run-2026-03-05-0001",
    "notes": "Generated from suggestion 2026-03-05-001."
  }
}
```

Core fields:

- `id`: Unique slug for the app, used in URLs and internal routing.  
- `name`: Human‑readable app title.  
- `shortDescription`: One‑sentence summary shown on the card.  
- `thumbnail`: Relative path to the app’s thumbnail image within the app folder.  
- `createdAt`: ISO‑8601 timestamp of the app’s generation time.  
- `category`: High‑level category (e.g., “Productivity”, “Utility”, “Games”).  
- `votes`: Integer vote count (for seeding or periodic syncing).  
- `status`: `active`, `hidden`, or `archived`, controlling showcase visibility.  
- `tags` (optional): Array of additional labels for future filtering.  
- `homepagePath` (optional): Relative path to the app’s entry point (default `index.html` if omitted).

Generation metadata (`generation` object, best‑effort; fields may be omitted or `null` if unavailable):

- `agentName`: Name/identifier of the agent that generated the app.  
- `llmModel`: Identifier of the LLM used (e.g., `gpt-5.1`, `claude-3-opus`).  
- `startTime`: ISO timestamp when generation started.  
- `endTime`: ISO timestamp when generation finished.  
- `totalTokensIn`: Total prompt/context tokens used for this build (if known).  
- `totalTokensOut`: Total completion tokens produced (if known).  
- `runId`: Unique identifier for the generation run, used to cross‑reference logs.  
- `notes`: Optional free‑form notes (e.g., “built from suggestion 2026‑03‑05‑001”).

### 8.2 Registry generation

To avoid filesystem access in the browser, a build script aggregates all `meta.json` files.

- Script scans `/apps/**/meta.json`.  
- Produces `src/data/apps.json` (committed or generated at build time).  
- Normalizes each record.

Example generated entry:

```json
{
  "id": "markdown-notes",
  "name": "Markdown Notes",
  "shortDescription": "A minimalist markdown note-taking app with live preview.",
  "thumbnailUrl": "/apps/2026/03/05/markdown-notes/thumbnail.png",
  "createdAt": "2026-03-05T02:30:00Z",
  "year": 2026,
  "month": 3,
  "day": 5,
  "category": "Productivity",
  "votes": 0,
  "status": "active",
  "route": "/apps/markdown-notes",
  "appPath": "/apps/2026/03/05/markdown-notes/index.html",
  "generation": {
    "agentName": "openclaw-dev-agent",
    "llmModel": "gpt-5.1",
    "startTime": "2026-03-05T03:21:45Z",
    "endTime": "2026-03-05T03:22:10Z",
    "totalTokensIn": 4200,
    "totalTokensOut": 3100,
    "runId": "run-2026-03-05-0001"
  }
}
```

This registry is what the React app imports at runtime.

### 8.3 Suggestions storage

Suggestions are stored as JSON files under `/suggestions`, organized by year and month.

Example:

```text
/suggestions
  /2026
    /03
      2026-03-05.json
      2026-03-06.json
```

Example file `2026-03-05.json`:

```json
[
  {
    "id": "2026-03-05-001",
    "title": "Habit tracker with streaks",
    "description": "A simple daily habit tracker with streaks and reminders.",
    "category": "Productivity",
    "submittedAt": "2026-03-05T12:34:56Z"
  }
]
```

Fields:

- `id`: Generated unique identifier.  
- `title`: Short idea title.  
- `description`: Longer description entered by the user.  
- `category`: Optional category tag.  
- `submittedAt`: ISO‑8601 timestamp of submission.  

OpenClaw reads from these files during its build cycle to select candidate ideas.

### 8.4 Voting model

Because the site is static‑hosted:

- The React app uses the `votes` field from the registry as the initial display value.  
- Voting interactions call a configurable vote endpoint (serverless/API or simple backend) that persists vote deltas outside the static repo.  
- Periodically, a process (manual or automated) can reconcile actual vote counts back into each app’s `meta.json`, but this is optional.  
- The showcase spec remains storage‑agnostic regarding vote persistence; only the UI and data shape are defined here.

***

## 9. Core user flows and pages

### 9.1 Home / Showcase page

**URL:** `/`  

**Purpose:** Gallery of all apps with filter/sort controls.

**Behavior:**

- On load, fetches/imports `apps.json` registry.  
- Renders a responsive grid of app cards.  
- Each card shows:
  - Thumbnail image.  
  - App name.  
  - Short description.  
  - Category pill.  
  - Creation date.  
  - Vote count and up‑vote button.

**Filtering and sorting:**

- Sort options:
  - “Newest” (descending `createdAt`).  
  - “Oldest” (ascending `createdAt`).  
  - “Highest rated” (descending `votes`).  
- Optional filters:
  - Category filter.  
  - Only `active` apps visible by default.

**Interactions:**

- Clicking a card:
  - Navigates to `/apps/:id`.  
- Clicking up‑vote:
  - Optimistically increments displayed vote count.  
  - Sends a request to the vote endpoint.  
  - Rolls back on error if needed.

### 9.2 App detail page

**URL:** `/apps/:id`  

**Purpose:** Provide context for a specific app and a way to launch/use it.

**Behavior:**

- Uses `:id` to look up the app in `apps.json`.  
- Displays:
  - App name and category.  
  - Created date.  
  - Description (short and optional extended).  
  - Thumbnail or hero image.  
  - Vote count and up‑vote button.  
  - Generation metadata (LLM model, agent name, generation timestamps, and, if present, token counts and run ID) in a small “Generated by” panel.

**Launching the app:**

- “Open app” button either:
  - Navigates to `appPath` (e.g., `/apps/2026/03/05/markdown-notes/index.html`) in the same or new tab, or  
  - Embeds the app in an iframe or micro‑frontend region.

**Error handling:**

- If `id` not found:
  - Show a 404 message with a link back to the home page.

### 9.3 Suggestion page / modal

**URL:** `/suggest` or modal from any page  

**Purpose:** Let users submit ideas for new apps.

**Form fields:**

- `title` (required).  
- `description` (required).  
- `category` (optional dropdown: Productivity, Utility, Games, Other).

**Behavior:**

- On submit:
  - Client‑side validation (non‑empty, length limits).  
  - POST to a suggestion API or service that appends to the appropriate `/suggestions/YYYY/MM/*.json` file.  
  - Show success or error state.

***

## 10. UI / UX and theming

- Design: modern, gallery‑style layout emphasizing polish and “showcase” quality.  
- Layout:
  - Responsive grid: one column on mobile, multi‑column on larger screens.  
  - Cards with shadows, hover transitions, and clear hierarchy.  
- Dark/light mode:
  - Implemented via Tailwind’s `dark` class strategy.  
  - Theme toggle in the header.  
  - User preference persisted (e.g., localStorage).  
- Accessibility:
  - Good contrast in both themes.  
  - Semantic HTML and ARIA where appropriate.  
  - Keyboard‑navigable with visible focus states.

***

## 11. Administration model

- No separate admin UI.  
- All administration is done via:
  - Adding/removing app folders under `/apps/YYYY/MM/DD/<app-id>`.  
  - Editing per‑app `meta.json`.  
  - Managing suggestion files under `/suggestions/YYYY/MM/*.json`.  
- The OpenClaw agent:
  - Creates new app folders with `meta.json` and assets.  
  - Populates and updates the `generation` metadata for each app (agent, model, times, token usage, run ID) where data is available.  
  - Updates `meta.json` fields (`status`, `votes`, descriptions, etc.).  
  - Adds suggestion entries based on existing `/suggestions` data and its own build decisions.  

Human maintainers can override or curate via manual commits and pull requests.

***

## 12. CI/CD and deployment

### 12.1 GitHub Pages configuration

- Repository is configured to publish via GitHub Pages using a GitHub Actions workflow.  
- Publishing source is set to use Actions (recommended) or a `gh-pages` branch.

### 12.2 Build and deploy workflow

**Trigger:**

- On every push to `main`.

**Conceptual steps:**

1. Check out the repository.  
2. Set up Node and cache dependencies.  
3. Install dependencies (`npm ci`).  
4. Run the registry generation script if needed.  
5. Build the React app (`npm run build`).  
6. Deploy the `build` directory to GitHub Pages using a deploy action.

On success, the latest showcase and apps are available at the configured Pages URL.

***

## 13. Security and abuse prevention

Security is a first‑class requirement, even without email or external integrations.

### 13.1 Trust boundaries and allowed actions

- All external input originates from the web UI and is treated as untrusted data.  
- The OpenClaw agent’s allowed repository actions are limited to:
  - Creating/updating app folders under `/apps/**`.  
  - Creating/updating per‑app `meta.json` (descriptive fields, generation metadata, vote counts, status).  
  - Appending suggestion records under `/suggestions/**`.  
- The agent must not modify:
  - CI/CD workflows.  
  - Project configuration files.  
  - Secrets or environment configuration.  
  - Files outside the defined content areas and registry outputs.

### 13.2 Input validation and sanitization

- All suggestion and voting payloads are validated and sanitized by a backend or service before being written to JSON:
  - Strict schemas (required fields, max lengths).  
  - Controlled categories or validated free text.  
  - Rejection of malformed or clearly malicious content.  
- User text is stored only as data and never executed or used as configuration.

### 13.3 AI agent behavior and isolation

- When reading JSON from `apps/**` and `suggestions/**`, the agent treats content as data, not as instructions.  
- The agent outputs only:
  - New or updated app code/assets.  
  - New or updated `meta.json` files (including `generation` metadata).  
  - New or updated suggestion records.  
- If a record fails validation or appears unsafe, the agent skips it and makes no repository changes.

### 13.4 Access control and permissions

- The agent uses a least‑privilege token or account scoped to:
  - Read the repository.  
  - Write to `apps/**`, `suggestions/**`, and registry data files.  
- It cannot:
  - Access other repositories.  
  - Modify organization‑level settings.  
  - Access additional secrets beyond what the CI requires.

### 13.5 Monitoring and review

- Agent‑initiated commits are attributable (e.g., via a dedicated bot account).  
- Periodic reviews:
  - Inspect diffs for unexpected changes outside `apps/**`, `suggestions/**`, and `logs/**`.  
  - Trigger a pause and permission review if suspicious activity appears.

***

## 14. Logging and auditability

The OpenClaw agent must write detailed, append‑only logs into the repository every time it performs an action.

### 14.1 Log location and structure

- Root log directory: `/logs`.  
- Subdirectories organized by year and month:

```text
/logs
  /2026
    /03
      2026-03-05.jsonl
      2026-03-06.jsonl
```

- Each daily log file is a JSON Lines (`.jsonl`) file, one JSON object per action.

Example log entry:

```json
{
  "timestamp": "2026-03-05T03:21:45Z",
  "agentId": "openclaw-dev-agent",
  "actionType": "CREATE_APP",
  "targetPath": "apps/2026/03/05/markdown-notes/meta.json",
  "description": "Created new app folder and meta.json for 'Markdown Notes'.",
  "details": {
    "appId": "markdown-notes",
    "category": "Productivity",
    "createdAt": "2026-03-05T03:21:45Z",
    "llmModel": "gpt-5.1",
    "runId": "run-2026-03-05-0001",
    "generationStartTime": "2026-03-05T03:21:45Z",
    "generationEndTime": "2026-03-05T03:22:10Z",
    "totalTokensIn": 4200,
    "totalTokensOut": 3100
  }
}
```

### 14.2 Logged events

Minimum action types:

- `CREATE_APP` – New app folder and `meta.json` created.  
- `UPDATE_APP_META` – Existing `meta.json` fields updated (including `generation` details as needed).  
- `UPDATE_APP_FILES` – App source/assets created or modified.  
- `ADD_SUGGESTION` – New suggestion record appended.  
- `REGISTRY_GENERATION` – Registry build or update (e.g., `src/data/apps.json`).  
- `NO_OP` – Explicit decision to skip an action due to validation or safety.

For `CREATE_APP` and `UPDATE_APP_FILES`, log entries should include, when available:

- `llmModel`, `runId`, `generationStartTime`, `generationEndTime`, `totalTokensIn`, `totalTokensOut`.

Each entry includes:

- `timestamp` (ISO‑8601 UTC).  
- `agentId`.  
- `actionType`.  
- `targetPath`.  
- `description`.  
- `details` (action‑specific fields).

### 14.3 Logging guarantees and constraints

- Logs are written as part of the same commit as the corresponding content change so history always pairs code/data changes with log entries.  
- Log entries are append‑only; the agent must not rewrite or delete existing entries, except under explicit, human‑controlled maintenance.  
- If logging fails (e.g., cannot write to `/logs/...`), the agent must abort the associated content change rather than perform unlogged actions.

### 14.4 Use in monitoring and review

- Reviewers correlate repo changes with log entries to understand:
  - Why a given app was created or updated.  
  - How votes, statuses, and generation patterns evolved.  
  - Which suggestions were ingested and when.  
- Optional automated checks can:
  - Verify that commits touching `apps/**` or `suggestions/**` include new log entries under `/logs/**`.  
  - Flag commits with content changes but no logs.

***

