# Social Share Hook — Implementation Plan

## Overview

Every app already loads `app-shell.js`, which ships a fully styled 10-platform share drawer (X,
Facebook, Reddit, LinkedIn, WhatsApp, Telegram, Pinterest, Email, Instagram, TikTok). That drawer
today uses a hardcoded share message and is only reachable through the footer "Share" button.

This plan exposes a `window.voaShare({ text, url })` hook that any app can call — at game-over, on a
high score, after a result is generated, or at any natural completion moment — to open that same
drawer pre-loaded with a contextual message.

No new UI is needed. All styling, platform coverage, and mobile bottom-sheet behaviour already exist.

---

## Design Decisions

| Decision               | Choice                                             | Reason                                                 |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------------ |
| Trigger mechanism      | `window.voaShare({ text?, url? })` global function | Simple to document, simple for AI agents to emit       |
| Which UI opens         | Existing 10-platform drawer                        | Already built, styled, and tested                      |
| Text ownership         | App constructs its own string                      | Maximum flexibility for score/result copy              |
| Games scope            | Required in NEW_APP prompt                         | Every game has a natural game-over moment              |
| Utilities scope        | Optional in NEW_APP and IMPROVEMENT prompts        | Only call when a result is genuinely share-worthy      |
| Shell dependency guard | `if (window.voaShare)` in app code                 | app-shell.js loads with `defer`; guard prevents errors |

---

## Recommendations

1. **Reformulate the share text in `app-shell.js`** so platform URLs are computed at drawer-open
   time, not at init time. This is the single architectural change required in the shell.

2. **Keep the hook tiny.** `window.voaShare({ text, url })` optionally accepts both params and falls
   back gracefully. Apps should not be required to pass both.

3. **Suggest share copy conventions** in the prompt docs so AI-generated messages stay consistent:
   - Games: `"I scored {score} in {App Name}! Can you beat it?"`
   - Utilities: `"I used {App Name} to {result}. Try it!"`
   - Always ends with the Valley of AI implied attribution (the URL in the drawer already links back)

4. **Do not add a visible "Share" button to game-over overlays by default** — the hook silently opens
   the drawer. If the agent wants to surface a button it may, but the hook can just as well be called
   automatically on game-over without requiring user action.

5. **New apps are forward-compatible** — `window.voaShare` becomes the standard; the footer Share
   button continues to work unchanged as a fallback for users who open the shell drawer manually.

---

## Phase 1 — `app-shell.js`: Expose `window.voaShare`

**File:** `apps/shared/app-shell.js`

### What changes

- Add two module-level variables inside the top-level IIFE (before `bootstrapShell`):

  ```js
  let _voaShareText = null;
  let _voaShareUrl = null;
  ```

- Refactor `openShareDrawer()` (currently defined inside `injectShell()`):
  - Move share URL/text construction **into** `openShareDrawer()` so it reads `_voaShareText` /
    `_voaShareUrl` at call time rather than at init time.
  - Compute derived values inside the function:
    ```js
    const url = _voaShareUrl || window.location.href;
    const text = _voaShareText || '👉 Checkout what AI built';
    const shareMsg = encodeURIComponent(text + ' ' + url);
    const shareEnc = encodeURIComponent(text);
    const urlEnc = encodeURIComponent(url);
    ```
  - Rebuild (or update) platform link `href` attributes with these runtime values before animating
    the drawer in. (Simplest: rebuild `shareGrid.innerHTML` with the same `platforms.map(...)` call
    using fresh values; the drawer is hidden so there is no visible flash.)
  - Reset `_voaShareText` / `_voaShareUrl` to `null` after drawer is populated so the next footer
    Share button press falls back to defaults.

- At the **bottom of `injectShell()`**, after `openShareDrawer` is defined, expose the hook:

  ```js
  window.voaShare = function voaShare(opts) {
    _voaShareText = (opts && opts.text) || null;
    _voaShareUrl = (opts && opts.url) || null;
    openShareDrawer();
  };
  ```

- The footer "Share" button continues to call `openShareDrawer()` with no arguments — **no change**
  to existing UX.

### Checklist

- [ ] Add `_voaShareText` / `_voaShareUrl` module-level variables inside IIFE
- [ ] Move URL/text construction inside `openShareDrawer()` (currently lines ~848-850)
- [ ] Rebuild platform `href` values at open time using runtime text/url
- [ ] Reset overrides after building so footer Share button reverts to defaults
- [ ] Assign `window.voaShare` at the end of `injectShell()`
- [ ] Manually test: footer Share button still shows default text
- [ ] Manually test: `window.voaShare({ text: 'I scored 1200!' })` opens drawer with custom text
- [ ] `xmllint` / basic JS syntax check (no build step exists; validate in browser)

---

## Phase 2 — `AGENT_PROMPT_SHARED.md`: Document the hook

**File:** `docs/agent-prompts/AGENT_PROMPT_SHARED.md`

Add a new "Social Share Hook" section after the existing shell layout documentation.

### Section to add

````md
## Social Share Hook

`app-shell.js` exposes `window.voaShare(options)`. Calling it opens the 10-platform share drawer
pre-loaded with a custom message. Use it at natural share moments: game-over, high-score, result
generated, task completed.

```js
// Call at the moment worth sharing (e.g. game-over):
if (window.voaShare) {
  window.voaShare({
    text: `I scored ${score.toLocaleString()} in Classic Tetris! Can you beat it?`,
    // url defaults to window.location.href — omit unless linking elsewhere
  });
}
```

**Options**

| Field | Type   | Default                       | Description                        |
| ----- | ------ | ----------------------------- | ---------------------------------- |
| text  | string | `"👉 Checkout what AI built"` | Custom share copy                  |
| url   | string | `window.location.href`        | Page URL included in share payload |

**Copy conventions**

- Games: `"I scored {score} in {App Name}! Can you beat it?"`
- Utilities / tools: `"I just used {App Name} to {result}. Try it!"`
- Keep under 200 characters so it fits in a tweet without truncation.

**When to call it**

- On game-over (pass final score or outcome)
- When a challenge or level streak is achieved
- When a creative output is generated (image, text, data)
- NOT on every user action — only once per natural completion moment

**Guard pattern** — `app-shell.js` loads with `defer`; always check before calling:

```js
if (window.voaShare) {
  window.voaShare({ text: '...' });
}
```
````

### Checklist

- [ ] Add "Social Share Hook" section to `AGENT_PROMPT_SHARED.md`
- [ ] Include full options table and copy conventions
- [ ] Include guard pattern code example
- [ ] Confirm section position is after shell layout docs and before "What NOT to do"

---

## Phase 3 — `AGENT_PROMPT_NEW_APP.md`: Require for games, promote for utilities

**File:** `docs/agent-prompts/AGENT_PROMPT_NEW_APP.md`

Add a step or sub-step to GENERATE_HTML (Step 3) that instructs the model to implement the share
hook.

### Content to add

Under the HTML generation step, add a "Social sharing" sub-requirement:

````md
### Social sharing (GENERATE_HTML sub-requirement)

**Games and score-based apps (required):**
Identify the game-over / round-end handler. Call `window.voaShare()` there with the final score or
outcome as the custom text. Example:

```js
function onGameOver() {
  // ... existing game-over logic (show overlay, stop loop, etc.) ...

  if (window.voaShare) {
    window.voaShare({
      text: `I scored ${score.toLocaleString()} in ${APP_NAME}! Can you beat it?`,
    });
  }
}
```

**Utilities and tools (implement when a result is generated):**
If the app produces a shareable output (a calculated value, generated text, a composition, etc.),
call `window.voaShare()` when that result is ready — typically on a button click that finalises the
result. If no single shareable result exists, omit the hook.
````

### Checklist

- [ ] Add social sharing sub-requirement under the GENERATE_HTML step
- [ ] Mark games as required, utilities as optional-when-result-exists
- [ ] Include concrete code example with `APP_NAME` and score pattern
- [ ] Verify wording does not conflict with existing shell documentation in AGENT_PROMPT_SHARED.md

---

## Phase 4 — `AGENT_PROMPT_IMPROVEMENT.md`: Promote as an improvement type

**File:** `docs/agent-prompts/AGENT_PROMPT_IMPROVEMENT.md`

Add a note that "add social sharing at game-over" is a valid and valued improvement for existing
apps, and provide the implementation pattern so the AI agent can apply it surgically.

### Content to add

Add to the section describing what kinds of improvements are valid:

````md
### Adding the social share hook to an existing app

If the improvement request asks to "add social sharing", "share score", or "post to social media":

1. Locate the game-over / result handler in `index.html`.
2. Add the guard-wrapped `voaShare` call immediately after the existing game-over logic, before
   any overlay or restart flow:
   ```js
   if (window.voaShare) {
     window.voaShare({ text: `I scored ${score.toLocaleString()} in ${appName}!` });
   }
   ```
3. Do not add a visible "Share" button unless the improvement request specifically asks for one —
   the drawer opens automatically via the hook.
4. Do not modify `app-shell.js` or the footer — the hook is already wired up.
````

### Checklist

- [ ] Add "Adding the social share hook" section to `AGENT_PROMPT_IMPROVEMENT.md`
- [ ] Confirm it references the AGENT_PROMPT_SHARED.md section for full options docs
- [ ] Keep the guidance surgical — do not re-document the full hook (that lives in SHARED)

---

## Phase 5 — Validation & Rollout

### Checklist

- [ ] End-to-end test in browser: open any existing app, run `window.voaShare({ text: 'Test!' })` in
      console, confirm drawer opens with correct text on all 10 platforms
- [ ] Footer Share button still works with default text (no regression)
- [ ] Confirm `window.voaShare` is `undefined` before `app-shell.js` loads (guard pattern is
      necessary)
- [ ] Generate one new test app through NEW_APP pipeline and verify the agent emits the hook at
      game-over
- [ ] Run `npm run validate:apps` to confirm no regressions in HTML contracts
- [ ] Update GROWTH_PLAN.md if a section covers social sharing

---

## Out of Scope (future)

- Native Web Share API fallback (could layer on top later without changing the hook signature)
- Passing platform-specific copy per platform (hook stays simple for now)
- Analytics event when `voaShare()` is called (Growth Plan 6.2 covers this)
- Retroactive improvements to existing apps (submit as individual improvement issues after Phase 5)
