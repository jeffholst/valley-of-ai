# Plan: Add or Modify App Categories

This document describes every file that must be updated when adding, removing, or renaming app categories.

---

## Files to Update

### 1. `.github/ISSUE_TEMPLATE/app_suggestion.yml`

The GitHub issue form dropdown. Add, remove, or rename entries under `body[0].attributes.options`.

### 2. `docs/json-schema/meta.json`

Contains an `enum` for the `category` field. Must stay in exact sync with the issue template.

### 3. `docs/json-schema/versus.json`

Also contains a `category` enum. Must stay in exact sync.

### 4. `docs/agent-prompts/AGENT_PROMPT_SHARED.md`

Line ~150 lists valid categories inline as prose (`one of Games | Productivity | ...`). Update to match.

### 5. `components/GalleryFilters.jsx`

**No change needed.** Categories are derived dynamically from `data/apps.json`:

```js
const categories = [...new Set(appsData.map((app) => app.category).filter(Boolean))].sort();
```

New categories appear automatically once apps use them.

### 6. Existing `apps/*/meta.json` files _(only if renaming)_

If renaming a category, update all affected `meta.json` files to use the new name.

---

## Steps

1. Decide exactly which categories to add, remove, or rename.
2. Update `.github/ISSUE_TEMPLATE/app_suggestion.yml` — the dropdown options.
3. Update `docs/json-schema/meta.json` — the `category` enum.
4. Update `docs/json-schema/versus.json` — the `category` enum.
5. Update `docs/agent-prompts/AGENT_PROMPT_SHARED.md` — the prose category list (~line 150).
6. _(Rename only)_ Update affected `apps/*/meta.json` files, then run:
   ```bash
   npm run generate:apps
   ```
7. Validate everything is consistent:
   ```bash
   npm run validate:apps
   ```
