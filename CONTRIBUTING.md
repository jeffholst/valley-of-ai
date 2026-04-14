# Contributing to Valley of AI

Thanks for your interest in contributing! Here's everything you need to get started.

## Quick Start

```bash
git clone https://github.com/jeffholst/valley-of-ai.git
cd valley-of-ai
cp .env.example .env          # fill in your keys
npm install
npm run dev                   # starts at http://localhost:3000
```

## Project Structure (30 seconds)

| Path                  | What lives here                                                 |
| --------------------- | --------------------------------------------------------------- |
| `app/`                | Next.js pages and routes                                        |
| `components/`         | Reusable React components                                       |
| `hooks/`              | Custom React hooks                                              |
| `scripts/`            | Build, sync, logging, and issue-pipeline scripts                |
| `data/`               | Committed JSON registries (`apps.json`, `versus-registry.json`) |
| `apps/`               | Source files for every AI-built app (`YYYY/MM/DD/<app-id>/`)    |
| `docs/agent-prompts/` | Prompt files read by AI agents at runtime — not for humans      |
| `__tests__/`          | Jest test files mirroring the source structure                  |

## Ways to Contribute

|                       |                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| **💡 Suggest an app** | [Submit an idea](https://www.valleyofai.com/#/suggest) — the AI pipeline will build it                     |
| **🐛 Report a bug**   | [Open an issue](https://github.com/jeffholst/valley-of-ai/issues/new/choose) using the bug report template |
| **🔧 Submit a PR**    | Improve the gallery UI, scripts, or docs (see below)                                                       |
| **⭐ Star the repo**  | Helps more people discover the project                                                                     |
| **💰 Tip/donate**     | [Keeps the AI agents running](https://www.valleyofai.com/?donate=1)                                        |

## Submitting a Pull Request

1. **Fork** the repo and create a branch: `feat/<what-you-built>` or `fix/<what-you-fixed>`
2. **Make your changes** following the guidelines below
3. **Verify** everything passes: `npm run lint && npm test && npm run build`
4. **Open a PR** — the template will guide you through what to include

## Guidelines

- **Style**: Follow the [Style Guide](https://github.com/jeffholst/valley-of-ai/wiki/Style-Guide) — naming, React patterns, Tailwind, commit messages
- **Testing**: Write tests for new logic in `__tests__/` — see the [Testing Guide](https://github.com/jeffholst/valley-of-ai/wiki/Testing-Guide)
- **Git workflow**: See the [Git Workflow](https://github.com/jeffholst/valley-of-ai/wiki/Git-Workflow) guide for branching and commit conventions
- **Pre-commit hook**: Husky runs `eslint --fix` + `prettier --write` automatically on staged files

## Code Quality Bar

All PRs must pass CI:

- `npm run lint` — 0 errors, 0 warnings
- `npm run format` — Prettier (100 char, single quotes, 2-space indent)
- `npm test` — all tests passing
- `npm run build` — clean production build

## Questions?

Open a [GitHub Discussion](https://github.com/jeffholst/valley-of-ai/discussions) or file an issue — we're friendly.
