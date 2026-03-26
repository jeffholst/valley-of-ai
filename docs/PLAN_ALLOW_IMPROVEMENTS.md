# Plan: `allowImprovements` Feature

Adds a per-app flag to enable or disable community improvement submissions. When `false`, the app is locked from new improvement issues — the pipeline will skip it, the UI will hide the submit button, and the improve page will show a clear message instead of the form.

---

## Overview of Changes

| Area               | File(s)                                                    | Change                                                            |
| ------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| Schema             | `docs/json-schema/meta.json`                               | Add `allowImprovements` boolean field                             |
| Registry builder   | `scripts/apps-registry.js`                                 | Pass `allowImprovements` through `transformMeta()`                |
| All existing apps  | `apps/**/meta.json` (all)                                  | Add `"allowImprovements": true` to each file                      |
| Registry           | `data/apps.json`                                           | Regenerate after meta.json updates                                |
| Pipeline guard     | `scripts/issues/select-app-improvement.js`                 | Skip apps with `allowImprovements: false`                         |
| Issue review guard | `scripts/issues/retrieve-pending-issues.js`                | Filter out improvement issues for locked apps                     |
| Gallery card       | `components/AppCard.jsx`                                   | Conditionally render "💡 Improve" button                          |
| Showcase page      | `app/showcase/[...id]/page.jsx`                            | Conditionally render "💡 Improve" button; show locked pill        |
| Improve page       | `app/improve/page.jsx`                                     | Show locked message and hide form when `allowImprovements: false` |
| API route          | `app/api/improvements/route.js`                            | Reject POST for locked apps (server-side guard)                   |
| Agent prompt       | `docs/agent-prompts/AGENT_PROMPT_IMPROVEMENT.md`           | Document `allowImprovements` check in Step 1                      |
| Agent prompt       | `docs/agent-prompts/AGENT_PROMPT_NEW_APP.md`               | Document setting `allowImprovements: true` in new app meta.json   |
| Agent prompt       | `docs/agent-prompts/AGENT_PROMPT_SHARED.md`                | Add `allowImprovements` to meta.json schema reference             |
| CLAUDE.md          | `CLAUDE.md`                                                | Note field in meta.json schema section                            |
| Tests              | `__tests__/api/improvements.test.js`                       | Add cases: locked app returns 403                                 |
| Tests              | `__tests__/scripts/issues/retrieve-pending-issues.test.js` | Add cases: improvement for locked app is filtered                 |
| README             | `README.md`                                                | Document the allowImprovements feature                            |

---

## Detailed Checklist

### Phase 1 — Schema & Data Model

- [ ] **1.1** Edit `docs/json-schema/meta.json`
  - Add `allowImprovements` to the `properties` block (after `visible`):
    ```json
    "allowImprovements": {
      "type": "boolean",
      "default": true,
      "description": "Whether community improvement submissions are accepted for this app. Defaults to true. Set to false to prevent new improvements."
    }
    ```
  - Do NOT add it to `required` — it is optional with an implicit default of `true`.
  - Confirm `additionalProperties: false` is still satisfied (field is listed in `properties`).

- [ ] **1.2** Update `scripts/apps-registry.js` — `transformMeta()` function
  - Add `allowImprovements: meta.allowImprovements ?? true` to the returned object (alongside `visible`, `status`, etc.).
  - This ensures the field is always present in `data/apps.json` with a resolved boolean, even for apps that predate the field.

- [ ] **1.3** Add `allowImprovements: true` to every existing `apps/**/meta.json`
  - Run a script or use a targeted find-and-replace to insert the field into all existing files.
  - Place it after the `visible` field (or after `status` if `visible` is absent) for consistent ordering.
  - Verify count: the number of modified files should equal `ls apps/*/*/*/*/meta.json | wc -l`.

- [ ] **1.4** Regenerate `data/apps.json`
  - Run `npm run generate:apps`.
  - Confirm every app entry now has `"allowImprovements": true`.

- [ ] **1.5** Run `npm run validate:apps` — must pass with 0 errors.

- [ ] **1.6** Run `npm test` — all existing tests must still pass.

---

### Phase 2 — Pipeline Guards (Scripts)

- [ ] **2.1** Edit `scripts/issues/select-app-improvement.js` — `lookupApp()` and `buildResult()`
  - After resolving `appEntry`, check `appEntry.allowImprovements`.
  - If `allowImprovements === false`, output:
    ```json
    {
      "source": "none",
      "found": false,
      "message": "App '<appId>' has allowImprovements: false — skipping. Remove the flag or choose a different app."
    }
    ```
  - This is the same early-exit shape as "no approved requests found", so the agent pipeline already knows to stop.
  - Handle both the registry path (field present) and the meta.json disk fallback path (read `meta.allowImprovements ?? true`).

- [ ] **2.2** Edit `scripts/issues/retrieve-pending-issues.js` — `isPendingCandidate()` or `retrievePendingIssues()`
  - For `improvement`-type issues: extract the `appId` from the issue body (reuse `extractAppPath()` from `issue-selection-heuristics.js`).
  - Look up the app in `data/apps.json` (or meta.json on disk as fallback).
  - If `allowImprovements === false`, return `false` from `isPendingCandidate()` so the issue is excluded from the pending review queue.
  - **Important:** `suggestion`-type issues are unaffected — the check applies only to `improvement` issues.
  - Import `data/apps.json` at the top of the file (it is already loaded by `select-app-improvement.js` as a pattern to follow).

  > **Design note:** Filtering here means locked apps never surface in the issue review workflow, which prevents agents from accidentally approving improvements for them. The API route (Phase 3) adds a second independent guard at submission time.

- [ ] **2.3** Run `npm test` — all tests must still pass before moving on.

---

### Phase 3 — API Route Guard

- [ ] **3.1** Edit `app/api/improvements/route.js` — `POST` handler
  - After validating `appId` format, load the app from `data/apps.json`:
    ```js
    import appsData from '@/data/apps.json';
    // ...
    const appEntry = appsData.find((a) => a.id === appId);
    if (appEntry && appEntry.allowImprovements === false) {
      return Response.json({ error: 'This app is not accepting improvements.' }, { status: 403 });
    }
    ```
  - If the app is not in the registry (unknown `appId`), allow it through as today — the pipeline's own guard handles that case.
  - This is a server-side hard stop independent of the UI, preventing direct API abuse.

---

### Phase 4 — UI

- [ ] **4.1** Edit `components/AppCard.jsx`
  - Wrap the `💡 Improve` `<Link>` in a conditional: only render when `app.allowImprovements !== false`.
  - Add a "locked" pill shown when `app.allowImprovements === false`:
    ```jsx
    {
      app.allowImprovements === false && (
        <span
          className="inline-flex items-center gap-0.5 text-[0.72rem] font-semibold tracking-wide text-slate-500 bg-slate-200 dark:bg-slate-700 dark:text-slate-400 rounded-full px-2 py-0.5 whitespace-nowrap"
          title="Improvements are disabled for this app"
        >
          🔒 Locked
        </span>
      );
    }
    ```
  - Place the pill in the same `<div>` that currently holds the Improve button, so the date alignment is unchanged.

- [ ] **4.2** Edit `app/showcase/[...id]/page.jsx` — `AppDetailContent`
  - Wrap the `💡 Improve` `<Link>` (line ~125) in a conditional: only render when `app.allowImprovements !== false`.
  - When locked, replace it with a small "🔒 Improvements locked" badge using consistent styling (match AppCard pill).

- [ ] **4.3** Edit `app/improve/page.jsx` — `ImprovePage`
  - The page currently receives only `appId` and `appName` from query params; it does not look up the app.
  - Add an app lookup at the top of the component:
    ```js
    import appsData from '@/data/apps.json';
    // inside ImprovePage:
    const appEntry = appsData.find((a) => a.id === appId);
    const improvementsAllowed = !appEntry || appEntry.allowImprovements !== false;
    ```
  - When `improvementsAllowed` is `false`, render a locked message **instead of** the form:
    ```jsx
    {
      !improvementsAllowed ? (
        <div className="card p-6 text-center">
          <p className="text-2xl mb-3">🔒</p>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Improvements are disabled
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            This app is not currently accepting improvement suggestions.
          </p>
          <Link href={`/showcase/${appId}`} className="btn-primary mt-4 inline-block">
            Back to app
          </Link>
        </div>
      ) : (
        <div className="card p-6">{/* existing form */}</div>
      );
    }
    ```
  - The thumbnail preview card above the form should still render regardless — it is useful context.
  - The `handleSubmit` function will never be called when locked, but the API route provides a secondary guard.

---

### Phase 5 — Tests

- [ ] **5.1** Edit `__tests__/api/improvements.test.js`
  - Add a mock for `@/data/apps.json` at the top of the file:
    ```js
    jest.mock('@/data/apps.json', () => [
      { id: '2026/03/24/my-app', allowImprovements: true },
      { id: '2026/03/24/locked-app', allowImprovements: false },
    ]);
    ```
  - Add a new `describe` block: `'allowImprovements guard'`
    - `it('returns 403 when app has allowImprovements: false', ...)`
    - `it('returns 201 when app has allowImprovements: true', ...)` (existing happy path still works)
    - `it('allows submission when appId is not in registry', ...)` (unknown app passes through)

- [ ] **5.2** Edit `__tests__/scripts/issues/retrieve-pending-issues.test.js`
  - Add a mock for `data/apps.json` or pass apps as a dependency injection if the module is refactored.
  - Add cases to the `isPendingCandidate` describe block:
    - `it('excludes improvement issues for apps with allowImprovements: false', ...)`
    - `it('includes improvement issues for apps with allowImprovements: true', ...)`
    - `it('includes suggestion issues regardless of allowImprovements', ...)`

- [ ] **5.3** Run `npm test` — all tests must pass, coverage must not regress.

---

### Phase 6 — Agent Prompt Documentation

- [ ] **6.1** Edit `docs/agent-prompts/AGENT_PROMPT_SHARED.md` — meta.json schema section
  - Add `allowImprovements` to the optional fields list:
    > - `allowImprovements`: boolean — defaults to `true`; set to `false` to prevent community improvement submissions for this app

- [ ] **6.2** Edit `docs/agent-prompts/AGENT_PROMPT_NEW_APP.md` — Step 5 (UPDATE_META_JSON) or wherever meta.json fields are listed
  - Note that new apps should **not** set `allowImprovements` during initial creation (it defaults to `true`).
  - If the pipeline author explicitly needs to lock a new app, they may set it to `false`.

- [ ] **6.3** Edit `docs/agent-prompts/AGENT_PROMPT_IMPROVEMENT.md` — Step 1 (SELECT_IMPROVEMENT)
  - Add a note after the `found: false` stop condition:
    > If `targetApp.allowImprovements === false`, treat this the same as `found: false` — stop and do not proceed. The selection script will handle this automatically, but double-check if the script output is ambiguous.

---

### Phase 7 — Documentation

- [ ] **7.1** Edit `CLAUDE.md` — meta.json schema section (Optional fields)
  - Add: `- \`allowImprovements\`: boolean — defaults to \`true\`; set to \`false\` to prevent community improvement submissions`

- [ ] **7.2** Edit `README.md`
  - In the section describing how community improvements work, add a subsection or note:
    > **Disabling improvements for an app**
    > Set `allowImprovements: false` in the app's `meta.json` to lock it from new community improvement submissions. The gallery card will show a 🔒 badge, the improve page will display a message instead of the form, and the pipeline will automatically skip the app during improvement selection. The field defaults to `true` for all apps.

---

### Phase 8 — Final Validation

- [ ] **8.1** Run `npm run validate:apps` — 0 errors.
- [ ] **8.2** Run `npm run lint` — 0 errors, 0 warnings.
- [ ] **8.3** Run `npm test` — all tests pass.
- [ ] **8.4** Run `npm run dev` and manually verify:
  - An app with `allowImprovements: true` shows the `💡 Improve` button in AppCard and showcase page.
  - An app with `allowImprovements: false` shows the `🔒 Locked` pill instead.
  - Navigating to `/improve?app=<locked-id>&name=<name>` shows the locked message, not the form.
  - Navigating to `/improve?app=<unlocked-id>&name=<name>` shows the normal form.
- [ ] **8.5** Commit all changes in a single PR with `[skip deploy]` in the commit message.
- [ ] **8.6** Run `npm run generate:apps` one final time before committing if any `meta.json` was touched after the last generation.

---

## Key Design Decisions

**Default behavior is opt-in:** `allowImprovements` defaults to `true`, so existing apps require no change to stay improvable. Setting it to `false` is an explicit opt-out.

**`allowImprovements` is independent of `visible`:** A hidden app (`visible: false`) can still have improvement issues internally; a visible app can be locked. These are orthogonal concerns.

**Resolve at read time in the registry:** `transformMeta()` resolves `meta.allowImprovements ?? true` so consumers always get a concrete boolean from `data/apps.json`. No consumer needs to handle `undefined`.

**Three independent enforcement layers:** UI (form hidden) → API route (403) → pipeline script (skipped). Each layer is independently correct; together they prevent bypass through any path.

**Unknown apps pass through the API guard:** If `appId` is not in the registry (e.g. a brand-new app not yet regenerated), the API does not block it. This preserves the existing behavior for edge cases and avoids timing issues during deployment.

**`retrieve-pending-issues.js` filters at review time:** This prevents improvement issues for locked apps from entering the agent review queue at all, reducing noise and preventing accidental approval of issues that the pipeline will ultimately reject.
