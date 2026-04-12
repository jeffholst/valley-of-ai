> **Wiki candidate:** This file is intended to move to the [GitHub Wiki](https://github.com/jeffholst/valley-of-ai/wiki) as the **How to Add a Versus Competition** page. Until then, the content lives here.

# How to Add a New Versus Competition

A versus competition is a head-to-head comparison where multiple AI models build an app from the exact same prompt. This guide covers the manual steps to set one up.

---

## Prerequisites

- At least **2 apps** (max 8) already built through the normal pipeline and present in `apps/` and `data/apps.json`.
- All competing apps must have been generated from the **same prompt** (or very close to it).
- Each app must have a valid `meta.json` with `generation.llmModel` populated so the registry can pull model info.

---

## Steps

### 1. Build the Competing Apps

Each app goes through the standard new-app pipeline (`docs/agent-prompts/AGENT_PROMPT_NEW_APP.md`). The only special requirement is that every competing app receives the **same prompt**.

Run the prompt through each model/agent you want to compare. Once all apps are merged to `main` and appear in `data/apps.json`, you can proceed.

### 2. Edit `data/versus.json`

This is the hand-authored source of truth. Add a new object to the array:

```json
{
  "id": "my-competition-id",
  "title": "My Competition Title",
  "prompt": "The exact prompt given to all models...",
  "createdAt": "2026-04-11T12:00:00Z",
  "category": "Games",
  "entries": [{ "appId": "2026/04/11/app-one" }, { "appId": "2026/04/11/app-two" }]
}
```

**Field rules:**

| Field       | Requirements                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `id`        | Unique, lowercase kebab-case (e.g. `memory-game-battle`)                                               |
| `title`     | 5-100 characters                                                                                       |
| `prompt`    | 20-2000 characters, the exact shared prompt                                                            |
| `createdAt` | ISO 8601 UTC timestamp                                                                                 |
| `category`  | One of: `Games`, `Productivity`, `Utilities`, `Design`, `Education`, `Entertainment`, `Visualizations` |
| `entries`   | 2-8 objects, each with an `appId` matching an entry in `data/apps.json`                                |

The JSON schema is at `docs/json-schema/versus.json` for reference.

### 3. Generate the Enriched Registry

```bash
npm run generate:versus
```

This reads `data/versus.json` and `data/apps.json`, enriches each entry with app metadata (name, thumbnail, model, agent, generation stats, improvement count), and writes the result to `data/versus-registry.json`.

### 4. Validate

```bash
npm run validate:apps
```

This checks that all `appId` references resolve, there are no duplicates, and both `versus.json` and `versus-registry.json` are in sync.

### 5. Commit Both Files

Stage and commit `data/versus.json` and `data/versus-registry.json` together:

```bash
git add data/versus.json data/versus-registry.json
git commit -m "feat: add <competition-id> versus competition"
```

---

## How the Pages Work

- **`/versus`** -- listing page showing all competitions sorted newest-first.
- **`/versus/<id>`** -- detail page with the shared prompt, a head-to-head comparison table, vote results bar, and entry cards with launch/vote buttons.

Voting is anonymous (one vote per user per competition, tracked via localStorage and stored in Supabase).

---

## Tips

- **Order matters:** entries appear in the UI in the same order as the `entries` array in `versus.json`.
- **Adding an entry later:** you can append a new `appId` to an existing competition's `entries` array, then re-run `npm run generate:versus` and commit both files.
- **Removing a competition:** delete the object from `versus.json`, re-run `npm run generate:versus`, and commit. Existing votes in Supabase will become orphaned but cause no errors.
- **No separate directory:** versus apps live in the normal `apps/YYYY/MM/DD/` tree alongside all other apps.
