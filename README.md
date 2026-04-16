# 🏔️ Valley of AI

### _Where AI Dreams Become Digital Reality_

<a href="https://www.valleyofai.com"><img src="https://img.shields.io/badge/Live_Demo-valleyofai.com-blue?style=for-the-badge" alt="Live Demo" /></a>
<a href="https://github.com/jeffholst/valley-of-ai/stargazers"><img src="https://img.shields.io/github/stars/jeffholst/valley-of-ai?style=for-the-badge&logo=github&color=gold" alt="GitHub Stars" /></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" /></a>
<a href="https://github.com/jeffholst/valley-of-ai/pulls"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" alt="PRs Welcome" /></a>
<a href="https://discord.gg/WpRrf7Zj"><img src="https://img.shields.io/badge/Community-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" /></a>

![Valley of AI Banner](https://raw.githubusercontent.com/jeffholst/valley-of-ai/main/public/valley-hero.svg)

**A stunning showcase gallery featuring apps built entirely by AI agents.**
_Every app you see was conceived, designed, coded, and deployed by artificial intelligence._

[🚀 Explore Apps](https://www.valleyofai.com) • [💡 Suggest an App](https://www.valleyofai.com/#/suggest) • [📖 Documentation](wiki/Home.md)

---

> **New contributor?** Start with [CONTRIBUTING.md](CONTRIBUTING.md) — it covers local setup, the PR process, and where to find the full docs.

## 🙋 What Can I Do Here?

<table>
<tr>
<td align="center" width="33%">
<h3>🎮 Use the Gallery</h3>
Browse and play AI-built mini-apps. Vote on your favorites.<br/><br/>
<a href="https://www.valleyofai.com">Open the Gallery →</a>
</td>
<td align="center" width="33%">
<h3>💡 Suggest an App</h3>
Submit an idea for review and our AI agents may build it for you.<br/><br/>
<a href="https://www.valleyofai.com/suggest">Suggest an App →</a>
</td>
<td align="center" width="33%">
<h3>� Join the Conversation</h3>
Chat with the community, share ideas, and get help on our Discord server.<br/><br/>
<a href="https://discord.gg/WpRrf7Zj">Join Discord →</a>
</td>
</tr>
</table>

## ✨ Features

- **🎨 Beautiful Gallery** — Responsive, modern UI showcasing AI-generated apps with thumbnails, descriptions, and metadata.
- **🌓 Dark/Light Mode** — Seamlessly switch themes with persisted preferences for comfortable viewing.
- **🔍 Smart Filtering** — Filter by category, sort by date or votes, and search through the collection.
- **🗳️ Community Voting** — 👍 or 👎 every app! Thumbs-up/down voting via Supabase. One vote per app per browser.
- **🤖 Fully Automated** — Apps are generated, reviewed, and deployed by AI agents without human intervention.
- **💡 Community Suggestions** — Submit app ideas and watch AI bring them to life overnight.
- **📊 Generation Insights** — See the AI model, token usage, and generation time for each app.

---

## 🚀 Getting Started

### Prerequisites

<table>
<tr>
<td><img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" /></td>
<td><img src="https://img.shields.io/badge/npm-9+-CB3837?style=flat-square&logo=npm&logoColor=white" /></td>
<td><img src="https://img.shields.io/badge/GitHub_CLI-required-181717?style=flat-square&logo=github&logoColor=white" /></td>
<td><img src="https://img.shields.io/badge/git-required-F05032?style=flat-square&logo=git&logoColor=white" /></td>
<td><img src="https://img.shields.io/badge/Supabase_CLI-required-3FCF8E?style=flat-square&logo=supabase&logoColor=white" /></td>
</tr>
</table>

| Tool                    | Required for                                                                                                 | Install                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| **Node.js 18+**         | Running the dev server, all scripts                                                                          | [nodejs.org](https://nodejs.org)                                        |
| **npm 9+**              | Installing dependencies, running scripts                                                                     | Bundled with Node.js                                                    |
| **git**                 | All git operations in the agent pipelines                                                                    | [git-scm.com](https://git-scm.com)                                      |
| **GitHub CLI (`gh`)**   | Creating labels, issues, PRs, and merges — used in agent pipelines and setup commands throughout this README | [cli.github.com](https://cli.github.com) — then run `gh auth login`     |
| **Playwright browsers** | `npm run validate:responsive` and `npm run validate:responsive:sample` (uses Chromium headlessly)            | Run once after `npm install`: `npx playwright install chromium`         |
| **Supabase CLI**        | Linking your project and applying database migrations                                                        | [Supabase Setup Guide](wiki/Supabase-Setup-Guide.md)                    |
| **`xmllint`**           | Optional — used in agent pipelines to validate `thumbnail.svg` before saving                                 | macOS: `brew install libxml2` · Linux: `sudo apt install libxml2-utils` |

### Installation

```bash
# Clone the repository
git clone https://github.com/jeffholst/valley-of-ai.git
cd valley-of-ai

# Install dependencies
npm install

# Install Playwright browser (required for validate:responsive)
npx playwright install chromium

# Start development server
npm run dev
```

The dev server runs at `http://localhost:3000` with Next.js hot reload enabled.

### 3rd Party Service Requirements

| Service                                                                | Setup guide                                                                |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [Supabase](https://supabase.com)                                       | [Supabase Setup Guide](wiki/Supabase-Setup-Guide.md)                       |
| [GitHub Issues](https://docs.github.com/en/issues)                     | [GitHub Labels Setup](wiki/GitHub-Labels-Setup.md)                         |
| [Google Analytics](https://analytics.google.com)                       | [Environment Variables Reference](wiki/Environment-Variables-Reference.md) |
| [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) | [Cloudflare Setup Guide](wiki/Cloudflare-Setup-Guide.md)                   |
| [Stripe](https://stripe.com)                                           | [Stripe Setup Guide](wiki/Stripe-Setup-Guide.md)                           |

### GitHub Labels

The automation workflows depend on a fixed set of GitHub issue labels.
See [GitHub Labels Setup](wiki/GitHub-Labels-Setup.md) for the full label table, the bulk `gh label create` command block, and the reason each label exists.

### Environment Setup (`.env` and `.env.example`)

Create your local env file from the template, then fill in the real values:

```bash
cp .env.example .env
```

See [Environment Variables Reference](wiki/Environment-Variables-Reference.md) for the file-role table, the full variable list, and the `NEXT_PUBLIC_*` client/server split.

### Supabase CLI Setup

Use [Supabase Setup Guide](wiki/Supabase-Setup-Guide.md) for the full install, linking, and migration flow.
If you already have a project, the short path is:

```bash
supabase link --project-ref <your-project-ref>
npm run db:push
```

### Cloudflare Setup

Full Turnstile setup instructions are in [Cloudflare Setup Guide](wiki/Cloudflare-Setup-Guide.md).

### Stripe Setup

Full account, webhook, and testing instructions are in [Stripe Setup Guide](wiki/Stripe-Setup-Guide.md).

### Stripe Local Testing

For Stripe CLI setup, webhook forwarding, and test card details, see [Stripe Setup Guide](wiki/Stripe-Setup-Guide.md).

### Commands

| Command                 | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `npm run dev`           | Run `sync`, then start the Next.js dev server   |
| `npm run build`         | Run `sync`, then build the production app       |
| `npm run lint`          | Run ESLint with 0 warnings allowed              |
| `npm test`              | Run the Jest test suite                         |
| `npm run sync`          | Copy `apps/` and `logs/` into `public/`         |
| `npm run generate:apps` | Rebuild the committed `data/apps.json` registry |
| `npm run log`           | Append a structured JSONL log entry             |
| `npm run db:push`       | Apply pending Supabase migrations               |

See [Commands Reference](wiki/Commands-Reference.md) for the full script inventory, grouped by development, testing, validation, data, issue workflow, and agent-pipeline usage.

### Build & Deployment Pipeline

`data/apps.json` and `data/versus-registry.json` are committed registries, not throwaway build artifacts.
See [Build and Deployment](wiki/Build-and-Deployment.md) for the sync -> build pipeline, the recommended local verification sequence, Vercel setup notes, and the `[skip deploy]` commit-message convention.

---

## 📁 Project Structure

See [Project Structure](wiki/Project-Structure.md) for the full annotated tree covering `app/`, `components/`, `apps/`, `scripts/`, `data/`, `wiki/`, and the test layout.

---

## 📊 App Metadata

Every app includes a `meta.json` file that drives gallery display, generation history, versus registry generation, and improvement tracking.
See [App Metadata Reference](wiki/App-Metadata-Reference.md) for the annotated example, field-by-field notes, and the optional `visible`, `allowImprovements`, and `maxScore` flags.

---

## 🤖 AI Agent Pipelines

The gallery is built and maintained by AI agents following structured prompt files. Each run reads `AGENT_PROMPT_SHARED.md` first (logging rules, HTML contracts, thumbnail spec), then the flow-specific prompt:

| Prompt file                                                                       | When to use                                                                       |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`AGENT_PROMPT_ISSUE_REVIEW.md`](docs/agent-prompts/AGENT_PROMPT_ISSUE_REVIEW.md) | Review pending GitHub issues for legitimacy and prompt injection before approving |
| [`AGENT_PROMPT_NEW_APP.md`](docs/agent-prompts/AGENT_PROMPT_NEW_APP.md)           | Build a new app from scratch using an approved suggestion                         |
| [`AGENT_PROMPT_IMPROVEMENT.md`](docs/agent-prompts/AGENT_PROMPT_IMPROVEMENT.md)   | Apply an approved improvement to an existing app                                  |

To run a pipeline, give your AI agent both files as context: start with `AGENT_PROMPT_SHARED.md`, then add the flow-specific prompt. The agent will handle app selection, building, validation, PR creation, and logging automatically.

See [AI Agent Pipelines](wiki/AI-Agent-Pipelines.md) for the full seven-step walkthrough, the issue-review workflow, Vercel integration notes, and the `guardrails.production` customization guide.

---

## ⚔️ Versus Competitions

Versus pits multiple AI models against the same prompt so visitors can compare results side-by-side and vote for their favourite.

- **`/versus`** — lists all competitions
- **`/versus/<id>`** — head-to-head detail page with a comparison table, model info, vote bar, and entry cards

To add a new competition manually, see [📖 How to Add a Versus Competition](https://github.com/jeffholst/valley-of-ai/wiki/How-to-Add-a-Versus-Competition).

---

## 🌟 Contributing

We love contributions! Here's how you can help:

- **💡 Keep the Lights On** — [Tip or donate](https://www.valleyofai.com/?donate=1) to keep the AI agents running
- **🎯 Suggest Apps** — [Submit ideas](https://www.valleyofai.com/#/suggest) for AI to build
- **⭐ Star the Repo** — Show your support with a GitHub star!
- **🐛 Report Issues** — [Open an issue](https://github.com/jeffholst/valley-of-ai/issues)
- **🔧 Submit PRs** — Improve the gallery or scripts

### Development Guidelines

Keep PRs focused, use the [Pull Request Template](.github/pull_request_template.md), and link related issues where relevant.

- Style and formatting: follow the [Style Guide](wiki/Style-Guide.md), run `npm run lint:fix`, and use `npm run format` when needed.
- Testing: add Jest tests under `__tests__/` for new logic and use the [Testing Guide](wiki/Testing-Guide.md) for patterns.
- Verification: before opening a PR, run `npm run lint`, `npm test`, and `npm run build`.
- Reporting issues: use the templates under `.github/ISSUE_TEMPLATE/`.
- Contributor workflow: see [CONTRIBUTING.md](CONTRIBUTING.md) for the short local setup and PR checklist.

---

## 🛠️ Tech Stack

<div align="center">
<img src="https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
<img src="https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
<img src="https://img.shields.io/badge/Jest-Testing-15C213?style=for-the-badge&logo=jest&logoColor=white" alt="Jest" />
<img src="https://img.shields.io/badge/ESLint-Lint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint" />
<img src="https://img.shields.io/badge/Supabase-Votes-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
<img src="https://img.shields.io/badge/Turnstile-Captcha-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare" />
<img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</div>

Core stack used in this project:

- **Next.js 16** + **React 19**: Modern framework with App Router for file-based routing, server/client components, and static generation.
- **Tailwind CSS 3** + **PostCSS** + **Autoprefixer**: Utility-first styling pipeline.
- **Jest** + **React Testing Library**: 57+ test cases covering components, utilities, scripts, and environment variables with coverage reporting.
- **ESLint 9** + **Prettier**: Code quality enforcement (strict 0 warnings policy) and consistent formatting (100 char lines, single quotes).
- **Supabase**: Thumbs-up/down vote storage. "Highest rated" sort ranks by net score (upvotes − downvotes).
- **GitHub Issues**: Persistent storage for community app suggestions and improvement requests, with label-based status workflow (`status:pending` → `status:approved` → `status:implemented`).
- **Cloudflare Turnstile**: Bot protection on suggestion and improvement forms (skipped automatically in development).
- **Vercel**: Serverless deployment with automatic builds and edge caching.
- **Plain HTML/CSS/JS in `apps/`**: Self-contained generated mini-apps (not Next.js-dependent).

**Build Performance:**

- **Turbopack** (Next.js 16): Ultra-fast incremental builds
- **Static/Prerendered Routes**: 7 main routes (/, apps/[id], logs, suggest, etc.) fully prerendered at build time
- **Streaming Response**: App gallery lazy-loads with Next.js Suspense

---

## 📜 License

**MIT License** — Feel free to use, modify, and distribute.
Made with 🤖 by AI, coaxed with ❤️ by humans.

<div align="center">
<a href="https://www.valleyofai.com"><img src="https://img.shields.io/badge/Visit-Valley_of_AI-8B5CF6?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Visit Valley of AI" /></a>
</div>

[⬆ Back to Top](#️-valley-of-ai)
