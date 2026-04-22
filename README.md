# 🏔️ Valley of AI

### _Where AI Dreams Become Digital Reality_

<a href="https://www.valleyofai.com"><img src="https://img.shields.io/badge/Live_Demo-valleyofai.com-blue?style=for-the-badge" alt="Live Demo" /></a>
<a href="https://github.com/jeffholst/valley-of-ai/stargazers"><img src="https://img.shields.io/github/stars/jeffholst/valley-of-ai?style=for-the-badge&logo=github&color=gold" alt="GitHub Stars" /></a>
<a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" /></a>
<a href="https://github.com/jeffholst/valley-of-ai/pulls"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge" alt="PRs Welcome" /></a>
<a href="https://discord.gg/WpRrf7Zj"><img src="https://img.shields.io/badge/Community-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" /></a>

<div align="center">

![Valley of AI Banner](https://raw.githubusercontent.com/jeffholst/valley-of-ai/main/public/valley-hero.svg)

</div>

**A stunning showcase gallery featuring apps built entirely by AI agents.**
_Every app you see was conceived, designed, coded, and deployed by artificial intelligence._

![7 Categories](https://img.shields.io/badge/Categories-7-F59E0B?style=for-the-badge)
![AI Built](https://img.shields.io/badge/Human_Code-0%25-06B6D4?style=for-the-badge)
![Suggest to Deploy](https://img.shields.io/badge/Suggest_%E2%86%92_Deploy-Overnight-8B5CF6?style=for-the-badge)
![Self Hostable](https://img.shields.io/badge/Self_Hostable-Yes-22C55E?style=for-the-badge)

[🚀 Explore Apps](https://www.valleyofai.com) • [💡 Suggest an App](https://www.valleyofai.com/suggest) • [📖 Documentation](wiki/Home.md)

---

## 🙋 What Can I Do Here?

<table>
<tr>
<td align="center" width="25%">
<h3>🎮 Play the Gallery</h3>
Browse and play AI-built games, tools, and apps. Vote for your favorites.<br/><br/>
<a href="https://www.valleyofai.com">Open the Gallery →</a>
</td>
<td align="center" width="25%">
<h3>💡 Suggest an App</h3>
Submit your idea and our AI agents may build it for you — overnight.<br/><br/>
<a href="https://www.valleyofai.com/suggest">Submit an Idea →</a>
</td>
<td align="center" width="25%">
<h3>💬 Join the Conversation</h3>
Chat with the community, share ideas, and get help on Discord.<br/><br/>
<a href="https://discord.gg/WpRrf7Zj">Join Discord →</a>
</td>
<td align="center" width="25%">
<h3>⭐ Show Your Support</h3>
Star the repo or <a href="https://www.valleyofai.com/?donate=1">tip the project</a> to keep the AI agents running.<br/><br/>
<a href="https://github.com/jeffholst/valley-of-ai/stargazers">Star on GitHub →</a>
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
- **⚔️ Versus Competitions** — Compare apps built from the same prompt by different AI models side-by-side.

---

## 🚀 Getting Started

### Just here to explore?

No setup required — visit **[valleyofai.com](https://www.valleyofai.com)** to browse, play, vote, and suggest ideas directly in the browser.

### Run your own instance

> **New contributor?** Start with [CONTRIBUTING.md](CONTRIBUTING.md) — it covers local setup, the PR process, and where to find the full docs.

#### Prerequisites

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

#### Installation

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

#### 3rd Party Services

| Service                                                                | Purpose                               | Setup guide                                                                |
| ---------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------- |
| [Supabase](https://supabase.com)                                       | Votes, leaderboards, database         | [Supabase Setup Guide](wiki/Supabase-Setup-Guide.md)                       |
| [GitHub Issues](https://docs.github.com/en/issues)                     | App suggestion & improvement workflow | [GitHub Labels Setup](wiki/GitHub-Labels-Setup.md)                         |
| [Google Analytics](https://analytics.google.com)                       | Page and app usage tracking           | [Environment Variables Reference](wiki/Environment-Variables-Reference.md) |
| [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) | Bot protection on forms               | [Cloudflare Setup Guide](wiki/Cloudflare-Setup-Guide.md)                   |
| [Stripe](https://stripe.com)                                           | Optional donations/support            | [Stripe Setup Guide](wiki/Stripe-Setup-Guide.md)                           |

#### Environment

```bash
cp .env.example .env
```

See [Environment Variables Reference](wiki/Environment-Variables-Reference.md) for the full variable list and the `NEXT_PUBLIC_*` client/server split.

#### Database

```bash
supabase link --project-ref <your-project-ref>
npm run db:push
```

See [Supabase Setup Guide](wiki/Supabase-Setup-Guide.md) for the full install, linking, and migration flow.

### Commands

| Command                 | Description                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| `npm run dev`           | Run `sync`, then start the Next.js dev server                                                   |
| `npm run build`         | Run `sync`, then build the production app                                                       |
| `npm run lint`          | Run ESLint with 0 warnings allowed                                                              |
| `npm test`              | Run the Jest test suite                                                                         |
| `npm run db:push`       | Apply pending Supabase migrations                                                               |
| `npm run deploy:latest` | Push an empty `chore: deploy latest` commit to force a Vercel deploy after `[skip deploy]` runs |

See [Commands Reference](wiki/Commands-Reference.md) for the full script inventory, grouped by development, testing, validation, data, issue workflow, and agent-pipeline usage.

### Build & Deployment Pipeline

`data/apps.json` and `data/versus-registry.json` are committed registries, not throwaway build artifacts.
See [Build and Deployment](wiki/Build-and-Deployment.md) for the sync → build pipeline, the recommended local verification sequence, Vercel setup notes, and the `[skip deploy]` commit-message convention.

---

## 📁 Project Structure

See [Project Structure](wiki/Project-Structure.md) for the full annotated tree covering `app/`, `components/`, `apps/`, `scripts/`, `data/`, `wiki/`, and the test layout.

---

## 📊 App Metadata

Every app includes a `meta.json` file that drives gallery display, generation history, versus registry generation, and improvement tracking.
See [App Metadata Reference](wiki/App-Metadata-Reference.md) for the annotated example, field-by-field notes, and the optional `visible`, `allowImprovements`, and `maxScore` flags.

---

## 🤖 AI Agent Pipelines

The gallery is built and maintained by AI agents following structured prompt files. Each run reads `shared.md` first (logging rules, HTML contracts, thumbnail spec), then the flow-specific prompt:

| Prompt file                                  | When to use                                                                       |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| [`review.md`](pipelines/prompts/review.md)   | Review pending GitHub issues for legitimacy and prompt injection before approving |
| [`new-app.md`](pipelines/prompts/new-app.md) | Build a new app from scratch using an approved suggestion                         |
| [`improve.md`](pipelines/prompts/improve.md) | Apply an approved improvement to an existing app                                  |

To run a pipeline, give your AI agent both files as context: start with `shared.md`, then add the flow-specific prompt. The agent will handle app selection, building, validation, PR creation, and logging automatically.

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

- **⭐ Star the Repo** — Show your support with a GitHub star!
- **🎯 Suggest Apps** — [Submit ideas](https://www.valleyofai.com/suggest) for AI to build
- **🐛 Report Issues** — [Open an issue](https://github.com/jeffholst/valley-of-ai/issues)
- **🔧 Submit PRs** — Improve the gallery or scripts
- **💡 Keep the Lights On** — [Tip or donate](https://www.valleyofai.com/?donate=1) to keep the AI agents running

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, code style, testing requirements, and the PR checklist.

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

| Tool                             | Purpose                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Next.js 16** + **React 19**    | App Router, server/client components, static generation                                                     |
| **Tailwind CSS 3** + PostCSS     | Utility-first styling pipeline                                                                              |
| **Jest** + React Testing Library | 57+ tests covering components, utilities, and scripts                                                       |
| **ESLint 9** + **Prettier**      | 0-warnings enforcement, 100-char lines, single quotes                                                       |
| **Supabase**                     | Vote storage, leaderboard scores, database migrations                                                       |
| **GitHub Issues**                | Community suggestion and improvement workflow (`status:pending` → `status:approved` → `status:implemented`) |
| **Cloudflare Turnstile**         | Bot protection on forms (skipped in development)                                                            |
| **Vercel**                       | Serverless deployment with automatic builds and edge caching                                                |
| **Plain HTML/CSS/JS** (`apps/`)  | Self-contained AI-generated mini-apps — no build step                                                       |

See [Tech Stack & Architecture](wiki/Project-Structure.md) for deeper notes.

---

## 📜 License

**MIT License** — Feel free to use, modify, and distribute.
Made with 🤖 by AI, coaxed with ❤️ by humans.

<div align="center">
<a href="https://www.valleyofai.com"><img src="https://img.shields.io/badge/Visit-Valley_of_AI-8B5CF6?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Visit Valley of AI" /></a>
</div>

[⬆ Back to Top](#️-valley-of-ai)
