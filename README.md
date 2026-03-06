# Valley of AI

A showcase gallery for AI-generated applications.

## Features

- 🎨 Beautiful responsive gallery of AI-generated apps
- 🌓 Dark/light mode with persisted preference
- 📱 Mobile-friendly design
- 🗂️ Category filtering and sorting
- 💡 Suggestion system for new app ideas
- 📊 Generation metadata display

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

> **Note:** On NAS or network mounts where symlinks aren't supported, use:
> ```bash
> npm install --no-bin-links
> ```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
/
├── src/
│   ├── components/    # Reusable React components
│   ├── pages/         # Page components
│   ├── data/          # Generated apps.json
│   └── styles/        # Global styles
├── public/            # Static assets
├── apps/              # AI-generated applications
│   └── YYYY/MM/DD/<app-id>/
│       ├── meta.json
│       ├── thumbnail.png
│       └── index.html
├── suggestions/       # User suggestions
│   └── YYYY/MM/*.json
├── logs/              # Agent action logs
│   └── YYYY/MM/*.jsonl
├── scripts/           # Build scripts
└── .github/workflows/ # CI/CD workflows
```

## Data Model

Each app has a `meta.json` with:

- Basic info: id, name, shortDescription, category, tags
- Timestamps: createdAt
- Status: votes, status
- Generation metadata: agentName, llmModel, tokens, runId

## License

MIT
