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

- **Style**: Follow [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md) — naming, React patterns, Tailwind, commit messages
- **Testing**: Write tests for new logic in `__tests__/` — see [docs/TESTING.md](docs/TESTING.md)
- **Git workflow**: See [docs/processes/git-workflow.md](docs/processes/git-workflow.md) for branching and commit conventions
- **Pre-commit hook**: Husky runs `eslint --fix` + `prettier --write` automatically on staged files

## Code Quality Bar

All PRs must pass CI:

- `npm run lint` — 0 errors, 0 warnings
- `npm run format` — Prettier (100 char, single quotes, 2-space indent)
- `npm test` — all tests passing
- `npm run build` — clean production build

## Questions?

Open a [GitHub Discussion](https://github.com/jeffholst/valley-of-ai/discussions) or file an issue — we're friendly.
