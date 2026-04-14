# Improvement Sanity Check

Automatic heuristic analysis applied to every improvement candidate before the pipeline begins work. It detects patterns that suggest an improvement may be unnecessary, repetitive, or counter-productive — and surfaces a risk level the agent uses to decide whether to proceed.

---

## Quick Reference

| `overallRisk` | Agent action             | Log step       |
| ------------- | ------------------------ | -------------- |
| `low`         | Continue silently        | _(none)_       |
| `medium`      | Log warning and continue | `SANITY_WARN`  |
| `high`        | Log abort and **stop**   | `SANITY_ABORT` |

Read `improvementSanity.overallRisk` from the selection output. If `isBoosted` is `true`, risk is capped at `medium` — the agent will always proceed.

---

## Output Shape

```json
{
  "overallRisk": "medium",
  "isBoosted": false,
  "totalImprovements": 4,
  "recentCount7d": 2,
  "recentCount30d": 4,
  "oscillationSignals": [],
  "recencyOverlapHits": [],
  "signals": {
    "frequencyRisk": "medium",
    "volumeRisk": "low",
    "oscillationRisk": "low",
    "overlapRisk": "low"
  },
  "reasons": ["2 improvements in the last 7 days (medium threshold: 2)"]
}
```

---

## Agent Behavior (AGENT_PROMPT_IMPROVEMENT.md)

After the guardrail check passes, the agent reads `improvementSanity.overallRisk` from the selection output:

**`low`** — continue silently.

**`medium`** — log `SANITY_WARN` and proceed. The reasons are recorded in the audit trail for human review:

```bash
npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --app-date <app-date> \
  --category pipeline --step SANITY_WARN --status warning \
  --message "Sanity warning — <reasons joined by '; '>. Proceeding with caution."
```

**`high`** — log `SANITY_ABORT` and **stop immediately**:

```bash
npm run log -- --runId <runId> --appId <app-id> --date YYYY/MM/DD --app-date <app-date> \
  --category pipeline --step SANITY_ABORT --status aborted \
  --message "Sanity check halted pipeline — <reasons joined by '; '>."
```

---

## Where It Runs

The check is computed inside `scripts/issues/select-app-improvement.js` when building the selection result. The output is available as `improvementSanity` on the JSON object returned by `npm run select:app:improvement`.

The improvement pipeline agent reads this field during Step 1.4 (after the guardrail check, before logging `SELECT_IMPROVEMENT`).

---

## Signals

Four independent signals contribute to `overallRisk`. Each is computed separately, then combined by taking the highest level across all signals (after boost overrides are applied).

### 1. Frequency (`frequencyRisk`)

Counts how many improvements have been applied to this app in recent rolling windows.

| Condition                                                                      | Risk     |
| ------------------------------------------------------------------------------ | -------- |
| `recentCount7d >= freqHighCount7d`                                             | `high`   |
| `recentCount7d >= freqMediumCount7d` OR `recentCount30d >= freqMediumCount30d` | `medium` |
| Otherwise                                                                      | `low`    |

**Purpose:** Prevents an app from being improved so rapidly that individual changes don't have time to be evaluated or used.

### 2. Volume (`volumeRisk`)

Counts the total number of improvements ever applied to this app.

| Condition                                | Risk     |
| ---------------------------------------- | -------- |
| `totalImprovements >= volumeHighTotal`   | `high`   |
| `totalImprovements >= volumeMediumTotal` | `medium` |
| Otherwise                                | `low`    |

**Purpose:** Flags apps that have accumulated an unusually large number of changes, which may indicate scope creep or repeated re-working of the same areas.

### 3. Oscillation (`oscillationRisk`)

Scans the most recent `oscillationWindow` improvements for descriptions containing reversal language — words that suggest a prior change is being undone.

Default oscillation keywords: `revert`, `restore`, `removed`, `re-add`, `add back`, `undo`, `roll back`, `put back`, `previous behavior`, `as it was`

| Condition                                                     | Risk   |
| ------------------------------------------------------------- | ------ |
| Any improvement in the window contains an oscillation keyword | `high` |
| Otherwise                                                     | `low`  |

`oscillationSignals` in the output lists the offending improvement descriptions.

**Purpose:** Detects back-and-forth churn, where functionality is added then removed then added again.

### 4. Recency Overlap (`overlapRisk`)

Extracts significant words (length ≥ 4) from the candidate description and compares them against the most recent `recencyOverlapWindow` improvement descriptions. If the shared-word fraction meets or exceeds `recencyOverlapThreshold`, the candidate is considered a near-duplicate of recent work.

The check only runs if the candidate has at least `recencyOverlapMinWords` significant words.

| Condition                                    | Risk     |
| -------------------------------------------- | -------- |
| Overlap fraction ≥ `recencyOverlapThreshold` | `medium` |
| Otherwise                                    | `low`    |

`recencyOverlapHits` in the output lists which prior improvements triggered the flag and the shared words.

**Purpose:** Catches near-duplicate requests that ask for something that was just implemented.

---

## Boost Behavior

Issues with the `boosted` label (paid/tipped requests) receive significantly reduced scrutiny. The rationale: someone has put money behind this request, so it should proceed unless there is an extremely strong reason not to.

Boost overrides are applied per-signal before combining:

| Override                    | Default | Effect                                               |
| --------------------------- | ------- | ---------------------------------------------------- |
| `boostOverridesHighFreq`    | `true`  | Frequency risk of `high` is reduced to `low`         |
| `boostOverridesOscillation` | `true`  | Oscillation risk (always `high`) is reduced to `low` |

After combining, a hard cap is applied:

| Setting        | Default    | Effect                                                             |
| -------------- | ---------- | ------------------------------------------------------------------ |
| `boostMaxRisk` | `'medium'` | Boosted issues can never have `overallRisk` higher than this level |

**Result:** A boosted issue can still be `medium` risk (e.g. due to high volume), but will never be `high` risk, and the agent will always proceed (medium = warn-and-continue).

When boost overrides reduce the risk, a note is added to `reasons`:
`"Boost override applied — risk reduced for paid/boosted request"`

---

## Configuration

All thresholds are defined in `SANITY_DEFAULTS` (exported from `scripts/issues/lib/issue-selection-heuristics.js`) and can be overridden by passing a partial `options` object to `computeImprovementSanity`.

| Parameter                   | Default      | Description                                                                                      |
| --------------------------- | ------------ | ------------------------------------------------------------------------------------------------ |
| `freqHighCount7d`           | `3`          | Improvements in last 7 days that trigger HIGH frequency risk                                     |
| `freqMediumCount7d`         | `2`          | Improvements in last 7 days that trigger MEDIUM frequency risk                                   |
| `freqMediumCount30d`        | `5`          | Improvements in last 30 days that trigger MEDIUM frequency risk                                  |
| `volumeHighTotal`           | `8`          | All-time improvement count for HIGH volume risk                                                  |
| `volumeMediumTotal`         | `5`          | All-time improvement count for MEDIUM volume risk                                                |
| `oscillationWindow`         | `4`          | Number of recent improvements to scan for reversal language                                      |
| `oscillationKeywords`       | _(10 terms)_ | Words in improvement descriptions that suggest undoing prior work                                |
| `recencyOverlapWindow`      | `2`          | Number of most-recent improvements to compare the candidate against                              |
| `recencyOverlapThreshold`   | `0.5`        | Fraction of significant candidate words that must appear in a recent description to flag overlap |
| `recencyOverlapMinWords`    | `3`          | Minimum significant candidate words required before the overlap check runs                       |
| `boostMaxRisk`              | `'medium'`   | Maximum `overallRisk` allowed for boosted issues                                                 |
| `boostOverridesHighFreq`    | `true`       | When true, high frequency risk is reduced to low for boosted issues                              |
| `boostOverridesOscillation` | `true`       | When true, oscillation risk is reduced to low for boosted issues                                 |

---

## Implementation Files

| File                                                              | Role                                                           |
| ----------------------------------------------------------------- | -------------------------------------------------------------- |
| `scripts/issues/lib/issue-selection-heuristics.js`                | `computeImprovementSanity` function + `SANITY_DEFAULTS` export |
| `scripts/issues/select-app-improvement.js`                        | Calls the check; adds `improvementSanity` to selection output  |
| `docs/agent-prompts/AGENT_PROMPT_IMPROVEMENT.md`                  | Agent instructions for reading and acting on the sanity result |
| `__tests__/scripts/issues/lib/issue-selection-heuristics.test.js` | Unit tests for all signals, boost behavior, and edge cases     |
