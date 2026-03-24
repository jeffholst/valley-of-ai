A multi‑agent flow makes sense; here’s a best‑practice pipeline tuned to your spec, with **runId** as the backbone across all agents.

## Overview: 5‑Agent Best‑Practice Flow

1. **Coordinator Agent** – owns `runId`, orchestrates all others.
2. **Concept & Research Agent** – defines what to build and why.
3. **Design & Spec Agent** – writes the detailed design.
4. **Build Agent** – codes app, thumbnail, meta, registry updates.
5. **Review & Deploy Agent** – QA, UX, and deployment.

Each agent **must** reuse the same `runId` created at the start of the transaction, and log `STEP` entries with that `runId`.

---

## 1. Coordinator Agent (owns runId)

**Responsibility**

- Start and close the **transaction** for a single app.
- Call all other agents in order, passing `runId` and artifacts.
- Make go/no‑go decisions (retry, send back to previous step, or abort).

**runId usage**

- At the very start, generate:

  ```js
  const logger = new AgentLogger('openclaw-dev-agent', 'gpt-5.1');
  const runId = logger.startTransaction(appId, suggestionId);
  ```

- Log:
  - `TRANSACTION_START` (already done by `startTransaction`).
  - Final `TRANSACTION_END` with `status: "success" | "failed"` and rolled‑up token and duration numbers.

**Inputs / Outputs**

- Input: optional suggestion id, or “create original concept”.
- Output: orchestrated sequence of artifacts:
  - `concept.json`
  - `design.md` / `design.json`
  - app files + `meta.json`
  - QA/UX reports
  - logs + live deployment.

---

## 2. Concept & Research Agent

**Responsibility**

- Choose/define the app concept based on suggestions and web research.
- Ensure it fits categories and constraints (static, fun, small/medium scope).

**runId usage**

- Receives `runId` from Coordinator.
- Logs a `STEP` for:
  1. `SELECT_SUGGESTION` (if applicable)
  2. `RESEARCH_IDEAS`

  Example log entries:

  ```json
  {"timestamp":"...","runId":"<runId>","type":"STEP","step":"SELECT_SUGGESTION","seq":1,"status":"completed","durationMs":1200,"details":{"suggestionId":"2026-03-06-001","title":"Word Scramble Game"}}
  {"timestamp":"...","runId":"<runId>","type":"STEP","step":"RESEARCH_IDEAS","seq":2,"status":"completed","durationMs":15000,"details":{"sourcesChecked":["codepen","github"],"uniqueAngle":"neon retro word scramble"}}
  ```

**Outputs**

Create a `concept.json`, for example:

```json
{
  "id": "neon-word-scramble",
  "category": "Games",
  "title": "Neon Word Scramble",
  "goal": "Time-based word scramble with combo scoring.",
  "targetUser": "casual players who enjoy quick word puzzles",
  "uniqueAngle": "neon retro aesthetic + combo multipliers",
  "constraints": {
    "staticOnly": true,
    "noExternalApis": true,
    "mobileFirst": true
  },
  "inspirations": ["classic anagram games", "neon arcade UIs"]
}
```

Coordinator passes `concept.json` and `runId` to the next agent.

---

## 3. Design & Spec Agent

**Responsibility**

- Turn `concept.json` into a detailed, implementable design.

**runId usage**

- Receives `runId`.
- Logs a `STEP`:

  ```json
  {
    "timestamp": "...",
    "runId": "<runId>",
    "type": "STEP",
    "step": "CREATE_DESIGN_SPEC",
    "seq": 3,
    "status": "completed",
    "durationMs": 8000
  }
  ```

**Outputs**

Produce `design.md` or `design.json` including:

- **User stories / flows** – how users start, play, win/lose, reset.
- **Screen/layout structure** – sections, states, and key components.
- **Game/app rules & mechanics** – scoring, timers, difficulty.
- **State model** – main JS state shape.
- **Edge cases** – empty inputs, game over, resize, mobile behaviors.
- **Theming & thumbnail notes** – what the UI should approximately look like.

Example (very abbreviated):

````markdown
# Neon Word Scramble – Design Spec

## Core Loop

- Player sees a scrambled 5–7 letter word.
- Has 30 seconds to guess; correct answers increase score and time.
- Combo multiplier grows with consecutive correct answers.

## Layout

- Centered card: title, timer, score, scrambled word, input + submit, hint button.
- Hint reveals first letter, reduces score.

## State

```js
{
  currentWord: string,
  scrambled: string,
  timeLeft: number,
  score: number,
  combo: number,
  status: "idle" | "playing" | "game-over"
}
```
````

...

````

Coordinator passes `design` + `concept` + `runId` to the Build Agent.

***

## 4. Build Agent (Implementation + meta + thumbnail)

**Responsibility**

- Implement the app per design.
- Ensure it complies with all **technical & structural** rules (GA snippet, shared shell, static only, etc.).
- Generate `index.html`, `thumbnail.svg`, `meta.json`.
- Run `npm run generate:apps`.

**runId usage**

- Receives `runId`.
- Logs at least:

  - `GENERATE_HTML`
  - `GENERATE_THUMBNAIL`
  - `CREATE_META_JSON`
  - `UPDATE_REGISTRY`
  - `GIT_BRANCH`
  - `GIT_COMMIT`

Example entries:

```json
{"timestamp":"...","runId":"<runId>","type":"STEP","step":"GENERATE_HTML","seq":4,"status":"completed","durationMs":5000,"tokensIn":3200,"tokensOut":2700}
{"timestamp":"...","runId":"<runId>","type":"STEP","step":"GENERATE_THUMBNAIL","seq":5,"status":"completed","durationMs":1800}
{"timestamp":"...","runId":"<runId>","type":"STEP","step":"CREATE_META_JSON","seq":6,"status":"completed","durationMs":600}
{"timestamp":"...","runId":"<runId>","type":"STEP","step":"UPDATE_REGISTRY","seq":7,"status":"completed","durationMs":2000}
````

**Key tasks**

- Enforce all the short‑spec rules:
  - `apps/YYYY/MM/DD/<app-id>/` with the 3 required files.
  - GA snippet with `__GA_MEASUREMENT_ID__`.
  - Shared shell tags and CSS variables for theming.
  - No external frameworks or network calls to third parties.
- Fill `meta.json`’s `generation` section using:
  - `runId` (same string as logging).
  - `startTime` and `endTime` based on OS UTC time.
  - `totalTokensIn` / `totalTokensOut` using runtime data or a documented estimate.

---

## 5. Review & Deploy Agent (QA, UX, Deployment)

**Responsibility**

- Do functional QA, UX review, and final deployment in one pass.

**runId usage**

- Receives `runId`.
- Logs:
  - `VALIDATE_APP` (or `QA_REVIEW`)
  - `PR_REVIEW`
  - `MERGE_PR`
  - `DEPLOY`

Example:

```json
{"timestamp":"...","runId":"<runId>","type":"STEP","step":"VALIDATE_APP","seq":8,"status":"completed","durationMs":6000,"details":{"blockingIssues":0,"recommendedImprovements":2}}
{"timestamp":"...","runId":"<runId>","type":"STEP","step":"PR_REVIEW","seq":9,"status":"completed","durationMs":2000}
{"timestamp":"...","runId":"<runId>","type":"STEP","step":"MERGE_PR","seq":10,"status":"completed","durationMs":1500}
{"timestamp":"...","runId":"<runId>","type":"STEP","step":"DEPLOY","seq":11,"status":"completed","durationMs":12000,"details":{"url":"https://www.valleyofai.com"}}
```

**QA responsibilities**

- Apply the **Master Checklist**:
  - Functional: game/app flows, win/lose or completion paths, restart.
  - Responsiveness: 320/768/1024 widths.
  - Theme: light/dark both work, colors legible.
  - Console: zero errors/warnings.
  - Thumb/meta/log consistency.

- Produce a structured QA result (even if everything passes):

  ```json
  {
    "runId": "<runId>",
    "appId": "neon-word-scramble",
    "status": "pass",
    "blockingIssues": [],
    "recommendedImprovements": ["Clarify hint penalty text", "Slightly increase mobile input size"]
  }
  ```

**UX responsibilities**

- Check copy clarity, button labels, error messages, and onboarding hints.
- Mark issues as `blocking`, `recommended`, or `nice_to_have`.

**Deploy responsibilities**

- After all blocking issues are fixed and re‑validated:
  - Ensure PR is merged.
  - Run `npm run deploy`.
  - Verify the app appears in the live gallery.
  - Update `TRANSACTION_END`.

---

## 6. Transaction Close (Coordinator)

Finally, the Coordinator Agent:

- Aggregates metrics (duration, total tokens, success/failure).
- Writes `TRANSACTION_END`:

```json
{
  "timestamp": "2026-03-06T03:00:48Z",
  "runId": "<runId>",
  "type": "TRANSACTION_END",
  "appId": "neon-word-scramble",
  "status": "success",
  "totalDurationMs": 48000,
  "totalTokensIn": 4000,
  "totalTokensOut": 4000,
  "filesCreated": ["index.html", "meta.json", "thumbnail.svg"]
}
```

At that point the **same `runId`** has:

- `TRANSACTION_START`
- All `STEP` entries from all agents
- `TRANSACTION_END`

— giving you a clean, end‑to‑end audit trail for a single autonomous app build.

Would you like a concrete JSON schema for `concept.json`, `design.json`, and `qa-report.json` so each agent has strongly typed interfaces to work against?

Sources
