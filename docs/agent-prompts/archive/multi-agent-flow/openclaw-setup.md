OpenClaw already gives you most of what you need to run a multi‑agent “Valley of AI app factory”: you define agents in a workspace, give them tools (git, shell, browser, etc.), and route tasks to them via the Gateway or CLI.[1][2][3]

Below is how to:

1. set up OpenClaw with agents,
2. map your Coordinator/Build/QA/Marketing roles onto OpenClaw agents, and
3. configure them so they can actually run your app pipeline.

---

## OpenClaw agents in a nutshell

- OpenClaw is a **self‑hosted gateway**: it sits between chat channels (Telegram, Discord, Slack, etc.) and one or more AI agents running on your machine.[2][4][1]
- Each **agent** has:
  - a workspace directory (files, repos, skills, logs),
  - an identity (name, avatar, persona),
  - configured tools (shell, web, git, browser, etc.),
  - and is run through OpenClaw’s agent loop (model calls + tool execution).[3][5][2]

The CLI exposes two important commands here:

- `openclaw agents ...` – manage agents (list, add, bind to channels, set identity).[6]
- `openclaw agent ...` – run one turn for a specific agent (from CLI), optionally delivering responses to a channel.[7]

---

## 1. Base OpenClaw setup

### Install and initialize

Typical setup (Mac/Linux/WSL):[4][8][9]

1. Install Node.js 18+ if you don’t have it.[8]
2. Install OpenClaw globally:

   ```bash
   npm install -g openclaw
   ```

3. Initialize a workspace:

   ```bash
   openclaw init
   ```

   This creates `~/.openclaw/` with config, default agent, and logs.[9][8]

4. Configure model provider & API key (via TUI or config file):[4][9]
   - Choose provider (OpenRouter, Anthropic, OpenAI, etc.).
   - Paste API key.
   - Save.

5. (Optional) Connect a chat channel (Telegram is common):[9][4]
   - Create a Telegram bot, get its token.
   - Pair it via the OpenClaw TUI or CLI so messages are routed to your agent.

You now have a running gateway and at least one agent (“main”) you can talk to from CLI or chat.[1][2][9]

---

## 2. Defining multiple agents for your pipeline

OpenClaw supports **multiple named agents**, each with its own workspace and identity.[10][6]

Example structure:

- `coord` – Coordinator agent
- `concept` – Concept & Research agent
- `design` – Design & Spec agent
- `build` – Build agent
- `review` – Review & Deploy agent
- `marketing` – Marketing & Launch agent

### Create and configure agents

Use the `openclaw agents` subcommands:[6][10]

```bash
# List existing agents
openclaw agents list

# Add dedicated workspaces
openclaw agents add coord   --workspace ~/.openclaw/workspace-coord
openclaw agents add concept --workspace ~/.openclaw/workspace-concept
openclaw agents add design  --workspace ~/.openclaw/workspace-design
openclaw agents add build   --workspace ~/.openclaw/workspace-build
openclaw agents add review  --workspace ~/.openclaw/workspace-review
openclaw agents add marketing --workspace ~/.openclaw/workspace-marketing
```

Then set identities (names/avatars) so you can distinguish them in logs and chat:[10][6]

```bash
openclaw agents set-identity --agent coord    --avatar avatars/coord.png
openclaw agents set-identity --agent build    --avatar avatars/build.png
openclaw agents set-identity --agent review   --avatar avatars/review.png
# ...and so on
```

You’ll keep your Valley‑of‑AI repo checked out inside one or more of these workspaces (typically the **build** + **review** workspaces, and optionally **coord** if you want it to edit pipeline config).

---

## 3. Giving agents the right tools

OpenClaw’s “agent loop” can call tools to do real work: shell, git, browser, etc.[5][2][3]

For your pipeline you’ll want at least:

- **Shell / filesystem** – to run `npm run generate:apps`, `npm run deploy`, edit files.
- **Git / GitHub integration** – to branch, commit, push, open PRs.[11]
- **Web search / browser** – for Concept & Research and Marketing.[8][4]

You configure these either via the TUI or agent config files (e.g. tools list in `AGENTS.md` / `TOOLS.md` depending on your OpenClaw version).[2][3][5]

High‑level:

- For `build` and `review` agents, enable:
  - shell tool with access scoped to the Valley‑of‑AI repo directory,
  - git tool configured with a dedicated GitHub token/account.[11]
- For `concept`, `design`, `marketing`, enable:
  - web search / browser tools,
  - read‑only shell/filesystem where needed.

Because OpenClaw runs on your machine/VM, these tools really execute commands, so follow its security guidance (separate user account, limited permissions).[5][2][9]

---

## 4. Running the agents via CLI

Once the gateway is up, you can send tasks to a specific agent using `openclaw agent`:[7][4]

Examples:

```bash
# Ask the coordinator to start a new app transaction
openclaw agent --agent coord --message "Start a new Valley of AI app generation run. Use appId=neon-word-scramble."

# Run a single turn of the build agent for a specific step
openclaw agent --agent build --message "Using runId=run-20260309T231500Z-a1b2c3 and appId=neon-word-scramble, implement the app based on concept.json and design.json in the workspace repo."
```

You can also route via channels, e.g., send a message in Telegram which is bound to the `coord` agent, and openclaw routes that message to the agent loop and returns responses there.[1][4][6]

---

## 5. Mapping your pipeline into OpenClaw agents

Here’s how your previously‑designed flow fits into OpenClaw.

### 5.1 Coordinator agent in OpenClaw

**Workspace**

- Clone your Valley‑of‑AI repo (or a “control” repo) into `~/.openclaw/workspace-coord`.
- Include:
  - the unified process docs,
  - JSON Schemas (`concept.json`, `design.json`, `meta.json`, `qa-report.json`, `marketing.json`),
  - any helper scripts (e.g., logging helpers).

**Prompt**

- System/identity instructions: use the Coordinator prompt you authored (“You own runId, call these other agents in order, log TRANSACTION_START/END, etc.”).
- Tools: allow it to:
  - read/write files in the workspace,
  - optionally call the OpenClaw CLI (via shell) to invoke other agents programmatically, or you can keep orchestration manual and just talk to it.

**Usage**

You can either:

- Manually call the other agents from outside (you drive the pipeline, Coordinator is just “brains”), or
- Give Coordinator a tool that shells out to `openclaw agent --agent build ...` to programmatically trigger the other agents—this is more advanced and closer to a fully autonomous multi‑agent system.[3][5]

### 5.2 Concept & Design agents

These can be relatively lightweight:

- Workspaces point at the same repo (or read‑only clones).
- Tools: web search/browser, read‑only fs.
- System prompts: use your Concept & Research and Design & Spec prompts.

Flow:

1. Coordinator sends them a task message including `runId`, `appId`, and where to write `concept.json` / `design.json`.
2. They generate the JSON artifacts in the workspace repo.
3. They log their `STEP` entries (e.g., via a logging script you expose as a tool or via instructions to append to `logs/YYYY/MM/DD.jsonl`).

### 5.3 Build agent

This is the most “dangerous” and powerful agent.

**Workspace**

- `~/.openclaw/workspace-build` should contain:
  - the Valley‑of‑AI repo, with npm scripts (`generate:apps`, `deploy`),
  - your JSON Schemas and `validateMeta` helper,
  - any other build tooling (e.g., git hooks).

**Tools**

- Shell, with working directory set to repo root.
- Git, configured with a dedicated GitHub account + PAT (per OpenClaw’s GitHub integration patterns).[11]
- Filesystem read/write.

**Agent prompt**

- Use the Build Agent prompt we wrote; emphasize:
  - must validate `meta.json` with Ajv + schema before committing,
  - must use OS UTC time via shell (`date -u +"%Y-%m-%dT%H:%M:%SZ"`) for timestamps,
  - must log each step into `logs/YYYY/MM/DD.jsonl` with `runId`.

**Typical turn**

You send:

> Using runId=run-20260309T231500Z-a1b2c3 and appId=neon-word-scramble, in this repo:  
> – read `concept.json` and `design.json`  
> – create `apps/YYYY/MM/DD/neon-word-scramble/index.html`, `thumbnail.svg`, and `meta.json`  
> – run `npm run generate:apps`  
> – log the `GENERATE_HTML`, `GENERATE_THUMBNAIL`, `CREATE_META_JSON`, and `UPDATE_REGISTRY` steps with this runId.

OpenClaw’s loop then lets the model call shell tools (to run npm, git) and file tools (to edit the repo) until the step is complete.[3][5]

### 5.4 Review & Deploy agent

**Workspace**

- Same repo as Build, but you can separate workspace if you want stricter tool grants.

**Tools**

- Shell (to run tests, open dev server if needed, `npm run deploy`).
- Browser (optional) to open `localhost` or the live site for visual QA.
- Git (for PR review/merge if you wire it that way).

**Usage**

Coordinator asks:

> With runId=..., appId=..., perform QA and UX review, then (if no blocking issues) approve the PR, merge to main, run `npm run deploy`, and verify the app is live. Log VALIDATE_APP, PR_REVIEW, MERGE_PR, DEPLOY steps.

You can keep human‑in‑the‑loop here by requiring the agent to generate a PR summary and proposed merge, then you click merge yourself.[12]

### 5.5 Marketing agent

This one mainly reads `meta.json` + URL and returns text.

**Workspace**

- Same repo, so it can read `meta.json` and know the app’s path.

**Tools**

- Optional web search for trend‑aware copy.
- No shell/git needed unless you want it to commit `marketing.json`.

**Usage**

Coordinator asks:

> Using runId=..., appId=..., URL=..., and meta.json, create marketing/YYYY/MM/<app-id>.json with launch posts for X, LinkedIn, and Mastodon, plus hashtags and a basic postingPlan. Log GENERATE_MARKETING_ASSETS.

---

## 6. Putting it together: example end‑to‑end

From your terminal (or via chat):

1. Start a transaction:

   ```bash
   openclaw agent --agent coord --message "Start a new Valley of AI app generation for appId=neon-word-scramble. Drive the full pipeline and return when the app is deployed."
   ```

2. Coordinator:
   - Generates `runId`.
   - Logs `TRANSACTION_START`.
   - Messages `concept` agent (internally or via your guidance).
   - Waits for `concept.json`.
   - Then `design` agent → `design.json`.
   - Then `build` agent → app files + registry.
   - Then `review` agent → QA + deploy.
   - Then `marketing` agent → `marketing.json`.
   - Finally logs `TRANSACTION_END`.

You can iterate gradually: first wire just `build` and `review` agents under OpenClaw, then add `concept/design/marketing` once you’re happy with the core loop.

Would you like a concrete example of an `AGENTS.md` (or equivalent) definition for, say, the `build` agent that lists its tools and includes your Build Agent system prompt?

Sources
[1] OpenClaw Docs https://docs.openclaw.ai
[2] What Is OpenClaw? The Open-Source AI Agent That Actually Does ... https://www.mindstudio.ai/blog/what-is-openclaw-ai-agent/
[3] Inside OpenClaw: How Your AI Assistant Actually Works https://ryancraventech.substack.com/p/inside-openclaw-how-your-ai-assistant
[4] OpenClaw AI/ML - AI/ML API Documentation https://docs.aimlapi.com/quickstart/openclaw
[5] What Is OpenClaw? Complete Guide to the Open-Source AI Agent https://milvus.io/blog/openclaw-formerly-clawdbot-moltbot-explained-a-complete-guide-to-the-autonomous-ai-agent.md
[6] agents - OpenClaw Docs https://docs.openclaw.ai/cli/agents
[7] agent - OpenClaw Docs https://docs.openclaw.ai/cli/agent
[8] How to Build Your Own AI Agent Team with OpenClaw in 15 Minutes https://ai2sql.io/how-to-build-your-own-ai-agent-team-with-openclaw-in-15-minutes
[9] How to Set Up OpenClaw: Your 24/7 AI Agent, Step by Step https://mrprompts.substack.com/p/how-to-set-up-openclaw-your-247-ai
[10] OpenClaw on Windows: Step-by-Step Install + Secure Personal AI ... https://www.linkedin.com/pulse/openclaw-windows-step-by-step-install-secure-personal-ramamurthy-5afxc
[11] Turning Your Openclaw AI Agent Into an Autonomous AI ... - YouTube https://www.youtube.com/watch?v=Itmf-5TCRKE
[12] GitAgent – Clone a repo, get an AI agent – Claude Code / OpenClaw https://news.ycombinator.com/item?id=47216582
[13] How to Setup Your First AI Agent (ClawdBot) - YouTube https://www.youtube.com/watch?v=BoC5MY_7aDk
[14] Deploy Your Own AI Agent in 45 Minutes - YouTube https://www.youtube.com/watch?v=sO6NSSOWDO0
[15] OpenClaw-RL: Train any agents simply by 'talking' - GitHub https://github.com/Gen-Verse/OpenClaw-RL
