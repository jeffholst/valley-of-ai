# Logging Enhancement Recommendation

## Current State Assessment

### What's Working Well ✅
1. **Centralized Log Storage** — All transactions logged to `/logs/YYYY/MM/DD.jsonl`
2. **App-Level Tracking** — Logs copied to each app's folder (`apps/YYYY/MM/DD/<app-id>/log.jsonl`)
3. **Frontend Dashboard** — `/logs` page displays transactions with filtering, status tracking, token counts
4. **Audit Trail** — Complete step-by-step pipeline logging (SELECT_SUGGESTION through MERGE_PR_DEPLOY)
5. **Transaction Grouping** — Logs grouped by `runId` for cohesive agent runs

### Current Limitations ❌
1. **No Thought Process Capture** — Agent reasoning/decisions not logged, only structured STEPs
2. **Manual Logging** — Agent must remember to log via echo commands (error-prone, already missing logs in memory-sequence)
3. **No Logging Abstraction** — Agents figure out timestamps, runId, JSON formatting themselves
4. **No Reasoning Display** — Visitors see only final STEP results, not how agent arrived at decisions
5. **Limited Metadata** — Only `tokensIn/Out`, `durationMs`, `details` — no decision rationale or alternative considerations
6. **Developer Friction** — Each agent integration must reinvent logging logic

---

## Recommended Solution: Unified Logging with npm Script

### Architecture Overview

```
Agent Pipeline
    ↓
npm run log -- --category <TYPE> --appId <ID> [OPTIONS]
    ↓
Logger.mjs (utility)
    ↓ (append to both)
/logs/YYYY/MM/DD.jsonl + /apps/YYYY/MM/DD/<appId>/log.jsonl
    ↓
Frontend: Filter by category & display reasoning + checks
```

### Unified Log Entry Schema

**Single entry type for all scenarios** — logs differentiated by `category` field:

```json
{
  "timestamp": "2026-03-16T00:03:15Z",
  "runId": "run-20260316T000246Z-b6352c",
  "appId": "memory-sequence",
  "category": "pipeline|reasoning|validation",
  "message": "Human-readable description",
  "phase": "GENERATE_HTML",
  
  "pipeline": {
    "step": "GENERATE_HTML",
    "seq": 3,
    "status": "completed",
    "durationMs": 15000,
    "tokensIn": 3000,
    "tokensOut": 2500
  },
  
  "reasoning": {
    "decision": "2x2-grid",
    "alternatives": ["3x3-grid", "responsive-grid"],
    "rationale": "Better thumb reach on mobile, adequate difficulty"
  },
  
  "validation": {
    "checkType": "file-exists|schema-valid|test-pass",
    "name": "index.html structure",
    "result": "PASS",
    "details": {}
  }
}
```

**Field Rules:**
- `timestamp`, `runId`, `appId`, `category`, `message` — always present
- `phase` — present for pipeline steps and reasoning entries (optional for validation)
- `pipeline` object — populated only when `category === "pipeline"` (includes step, seq, status, durationMs, tokens)
- `reasoning` object — populated only when `category === "reasoning"` (includes decision, alternatives, rationale)
- `validation` object — populated only when `category === "validation"` (includes checkType, result, details)
- `seq` (sequence number) — **pipeline entries only** (helps with progress tracking: "step 3 of 13")

**Rationale for optional/category-specific fields:**
- Timestamps provide ordering for all entries
- Only pipeline steps benefit from seq numbering for progress visualization
- Reasoning and validation entries don't fit sequential numbering scheme

**Benefits:**
- Single schema to parse, store, and validate
- All fields optional depending on `category`
- Future-proof — add new categories without schema migration
- Easy filtering: `entry.category === 'pipeline'`
- Agents use single command pattern for all scenarios

---

## Implementation: npm Script (`scripts/logger.js`)

### Usage Pattern for Agents

**Before (current — error-prone):**
```bash
echo '{"timestamp":"...","runId":"...","type":"STEP",...}' >> apps/YYYY/MM/DD/<app-id>/log.jsonl
```

**After (unified single pattern):**

**Log a pipeline step (seq for progress tracking):**
```bash
npm run log -- \
  --runId run-20260316T000246Z-b6352c \
  --appId memory-sequence \
  --category pipeline \
  --step GENERATE_HTML \
  --seq 3 \
  --durationMs 15000 \
  --tokensIn 3000 \
  --tokensOut 2500 \
  --message "Generated index.html with 2x2 grid layout"
```

**Log a reasoning decision (no seq needed):**
```bash
npm run log -- \
  --runId run-20260316T000246Z-b6352c \
  --appId memory-sequence \
  --category reasoning \
  --phase GENERATE_HTML \
  --message "2x2 grid optimal for mobile responsiveness" \
  --decision "grid-2x2" \
  --alternatives "grid-3x3,grid-responsive" \
  --rationale "Better thumb reach on mobile, adequate difficulty"
```

**Log a validation check (no seq needed):**
```bash
npm run log -- \
  --runId run-20260316T000246Z-b6352c \
  --appId memory-sequence \
  --category validation \
  --checkType "file-exists" \
  --name "HTML structure validation" \
  --result PASS \
  --message "All HTML files valid and accessible"
```

### Logger Script Features

```javascript
// scripts/logger.js

/**
 * USAGE:
 * npm run log -- --runId <RUN_ID> --appId <APP_ID> --category <CATEGORY> [OPTIONS]
 *
 * Categories:
 *   pipeline    - Pipeline steps (requires: --step, --status)
 *   reasoning   - Agent reasoning/decisions (requires: --message, optionally --decision)
 *   validation  - Checks and validation (requires: --checkType, --result)
 *
 * Common OPTIONS:
 *   --message <TEXT>      Human-readable description of the log entry
 *   --phase <PHASE>       Pipeline phase (e.g., GENERATE_HTML, VALIDATE_APP)
 *   --status <STATUS>     completed|failed|in-progress (default: completed)
 *   --appPath <PATH>      Optional app path (overrides YYYY/MM/DD/<appId>)
 *   --dry-run             Print entry without appending
 *
 * Pipeline-specific OPTIONS (only for --category pipeline):
 *   --step <STEP_NAME>    Step name (SELECT_SUGGESTION, GENERATE_HTML, etc.)
 *   --seq <N>             Step sequence number (1-14) — for progress tracking only
 *   --durationMs <N>      Duration in milliseconds
 *   --tokensIn <N>        Input tokens consumed
 *   --tokensOut <N>       Output tokens produced
 *
 * Reasoning-specific OPTIONS:
 *   --decision <DECISION> Decision made (will be part of reasoning object)
 *   --alternatives <CSV>  Comma-separated alternatives considered
 *   --rationale <TEXT>    Why this decision over alternatives
 *
 * Validation-specific OPTIONS:
 *   --checkType <TYPE>    file-exists|schema-valid|test-pass|responsive|performance
 *   --name <NAME>         Human-readable check name
 *   --result <RESULT>     PASS|FAIL|WARN
 *   --details <JSON>      Additional metadata about the check
 *
 * EXAMPLES:
 *   # Pipeline step with seq for progress tracking
 *   npm run log -- --runId run-20260316-abc123 --appId my-app --category pipeline \
 *     --step GENERATE_HTML --seq 3 --status completed --durationMs 5000 \
 *     --tokensIn 3000 --tokensOut 2500 --message "Generated index.html"
 *
 *   # Reasoning entry (no seq needed)
 *   npm run log -- --runId run-20260316-abc123 --appId my-app --category reasoning \
 *     --phase GENERATE_HTML --message "2x2 grid optimal for mobile" \
 *     --decision "grid-2x2" --alternatives "grid-3x3,grid-responsive" \
 *     --rationale "Better thumb reach on mobile"
 *
 *   # Validation check (no seq)
 *   npm run log -- --runId run-20260316-abc123 --appId my-app --category validation \
 *     --checkType "file-exists" --name "HTML validation" --result PASS \
 *     --message "All 53 HTML files valid"
 *     --message "All 53 HTML files valid"
 *
 *   # Transaction end (with tokens and files)
 *   npm run log -- --runId run-20260316-abc123 --appId my-app --category pipeline \
 *     --step TRANSACTION_END --status success --message "App generation complete" \
 *     --details '{"filesCreated":["index.html","meta.json","thumbnail.svg"]}'
 */

import fs from 'fs';
import path from 'path';
import minimist from 'minimist';

const args = minimist(process.argv.slice(2));

// Validation
if (!args.runId || !args.appId || !args.category) {
  console.error('ERROR: --runId, --appId, and --category required');
  process.exit(1);
}

// Build unified entry
const entry = {
  timestamp: new Date().toISOString(),
  runId: args.runId,
  appId: args.appId,
  category: args.category,
  message: args.message || '',
  phase: args.phase || null,
};

// Populate category-specific fields
if (args.category === 'pipeline') {
  entry.pipeline = {
    step: args.step,
    seq: args.seq ? parseInt(args.seq) : null,
    status: args.status || 'completed',
    durationMs: args.durationMs ? parseInt(args.durationMs) : null,
    tokensIn: args.tokensIn ? parseInt(args.tokensIn) : null,
    tokensOut: args.tokensOut ? parseInt(args.tokensOut) : null,
  };
} else if (args.category === 'reasoning') {
  entry.reasoning = {
    decision: args.decision || null,
    alternatives: args.alternatives ? args.alternatives.split(',').map(a => a.trim()) : [],
    rationale: args.rationale || null,
  };
} else if (args.category === 'validation') {
  entry.validation = {
    checkType: args.checkType,
    name: args.name || null,
    result: args.result,
    details: args.details ? JSON.parse(args.details) : {},
  };
}

// Append to logs
if (!args['dry-run']) {
  appendToLogs(args.appId, entry);
}

console.log(JSON.stringify(entry));

// Helper functions...
```

---

## Frontend Enhancement: Reasoning Display

### New Components

**LogDetailModal** — Expanded view showing:
- **Timeline** of pipeline entries with durations
- **Reasoning Sidebar** — Decisions & rationale grouped by phase
- **Validation Results** — Check status indicators (green/red/yellow)
- **Error Recovery** — If step failed, shows reasoning recovery path

**Example UI:**
```
📊 Generate HTML (Step 3)
├─ Duration: 15.0s | ↓3k tokens | ↑2.5k tokens
├─ Status: ✅ Completed
│
├─ **REASONING:**
│  ├─ 💭 "Simon Says mechanics proven effective"
│  ├─ 💭 "2x2 grid chosen for mobile first"
│  │     alternatives: 3x3 grid, responsive grid
│  │     rationale: thumb reach on mobile
│  └─ 💭 "CSS grid implementation with flex fallback"
│
└─ **VALIDATION:**
   ├─ ✅ Shared shell tags present
   ├─ ✅ GA measurement ID placeholder intact
   ├─ ✅ SVG favicon generated
   └─ ✅ Mobile viewport configured
```

### Updated `/app/logs/page.jsx`

Add unified entry-type filter:
```jsx
// Show different log categories in same timeline
<select value={categoryFilter}>
  <option value="all">All entries</option>
  <option value="pipeline">Pipeline steps only</option>
  <option value="reasoning">Reasoning only</option>
  <option value="validation">Validation only</option>
</select>
```

Add collapsible "Reasoning" section in StepRow:
```jsx
function LogEntry({ entry }) {
  return (
    <div className="border-l-4 border-gray-300 pl-4 py-2">
      {/* Timestamp and phase */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {formatTimestamp(entry.timestamp)} • {entry.phase}
      </div>

      {/* Main message */}
      <div className="text-sm font-medium">{entry.message}</div>

      {/* Category-specific details */}
      {entry.category === 'pipeline' && (
        <div className="text-xs text-gray-500 mt-1">
          ⏱️ {entry.pipeline.durationMs}ms
          {entry.pipeline.tokensIn && ` | ↓${entry.pipeline.tokensIn}`}
          {entry.pipeline.tokensOut && ` | ↑${entry.pipeline.tokensOut}`}
        </div>
      )}

      {entry.category === 'reasoning' && entry.reasoning.alternatives.length > 0 && (
        <details className="text-xs mt-1">
          <summary className="cursor-pointer text-blue-600">Show decision details</summary>
          <div className="mt-1 text-gray-600">
            <div>Alternatives: {entry.reasoning.alternatives.join(', ')}</div>
            <div>Rationale: {entry.reasoning.rationale}</div>
          </div>
        </details>
      )}

      {entry.category === 'validation' && (
        <div className={`text-xs mt-1 ${entry.validation.result === 'PASS' ? 'text-green-600' : 'text-red-600'}`}>
          {entry.validation.result} • {entry.validation.checkType}
        </div>
      )}
    </div>
  );
}
```

---

## Action Items

### Phase 1: Create Logger Utility (Priority: HIGH)
- [ ] Create `scripts/logger.js` with step/thought/check support
- [ ] Add `npm run log` script to package.json
- [ ] Add minimist dependency: `npm install minimist`
- [ ] Test logger with both app-level and central logs
- [ ] Update AGENT_PROMPT.md to use `npm run log` instead of echo

### Phase 2: Enhance Agent Instructions (Priority: HIGH)
- [ ] Update both AGENT_PROMPT.md and AGENT_PROMPT_ULTRA_COMPACT.md
- [ ] Replace manual echo commands with `npm run log` calls
- [ ] Add THOUGHT logging at key decision points:
  - After research (why this app concept over alternatives?)
  - After HTML generation (design decisions)
  - During git workflow (why squash? why this branch?)
- [ ] Add CHECK logging for all validation steps

### Phase 3: Frontend Display (Priority: MEDIUM)
- [ ] Update `/app/logs/page.jsx` to parse and display THOUGHT entries
- [ ] Add "Reasoning" collapsible section to TransactionCard
- [ ] Create ThoughtEntry component with category badges
- [ ] Add entry-type filter dropdown
- [ ] Update StepRow to link to related thoughts

### Phase 4: Documentation (Priority: MEDIUM)
- [ ] Create `docs/LOGGING_GUIDE.md` for agent developers
- [ ] Show examples of good thought process logging
- [ ] Document best practices (when to log thoughts, what level of detail)
- [ ] Add thought logging checklist to AGENT_PROMPT.md

---

## Benefits

### For Agents
✅ **Simplicity** — Single `npm run log` call instead of building JSON manually
✅ **Consistency** — Timestamps, formatting, file paths auto-handled
✅ **Auditability** — Thoughts captured alongside transactions
✅ **Debugging** — Reason chains help identify where decisions went wrong

### For Visitors
✅ **Transparency** — See not just what happened, but why
✅ **Learning** — Understand agent decision-making process
✅ **Trust** — See alternative paths considered & why rejected
✅ **Debugging** — Pinpoint where reasoning diverged from intention

### For Project
✅ **Featured Logging** — Makes logs a showcase, not a footnote
✅ **Better Audit Trail** — Complete transaction + reasoning history
✅ **Pattern Recognition** — See recurring patterns in successful/failed runs
✅ **Training Data** — Thought logs as future training examples

---

## Example: Complete Memory-Sequence Pipeline with Logging

All examples use the same `npm run log` pattern with `--category`:

```bash
# Step 0: Prep (transaction start)
npm run log -- --runId run-20260316T000246Z-b6352c --appId memory-sequence \
  --category pipeline --step TRANSACTION_START --status started \
  --message "Starting app generation pipeline"

# Step 1: SELECT_SUGGESTION (pipeline + reasoning)
npm run log -- --runId run-20260316T000246Z-b6352c --appId memory-sequence \
  --category pipeline --step SELECT_SUGGESTION --seq 1 --durationMs 1500 \
  --message "Selected memory-sequence concept"

npm run log -- --runId run-20260316T000246Z-b6352c --appId memory-sequence \
  --category reasoning --phase SELECT_SUGGESTION \
  --message "Memory/Simon game proven addictive pattern" \
  --decision "memory-sequence" --alternatives "tile-match,word-guess" \
  --rationale "Not in current /apps, high engagement, simple mechanics"

# Step 3: GENERATE_HTML (pipeline + multiple reasoning entries)
npm run log -- --runId run-20260316T000246Z-b6352c --appId memory-sequence \
  --category reasoning --phase GENERATE_HTML \
  --message "2x2 grid optimal for mobile responsiveness" \
  --decision "2x2-grid" --alternatives "3x3-grid,responsive-grid" \
  --rationale "Better thumb reach on mobile, adequate difficulty"

npm run log -- --runId run-20260316T000246Z-b6352c --appId memory-sequence \
  --category reasoning --phase GENERATE_HTML \
  --message "Sequence generation: 1-color start, +1 per round" \
  --decision "incremental-sequence" --alternatives "random-length,fixed-length"] \
  --rationale "Progressive difficulty increases engagement"

npm run log -- --runId run-20260316T000246Z-b6352c --appId memory-sequence \
  --category pipeline --step GENERATE_HTML --seq 3 \
  --durationMs 15000 --tokensIn 3000 --tokensOut 2500 \
  --message "Generated index.html with game engine and responsive layout"

# Step 6: VALIDATE_APP (validation entries)
npm run log -- --runId run-20260316T000246Z-b6352c --appId memory-sequence \
  --category validation --checkType "file-exists" \
  --name "index.html" --result PASS \
  --message "HTML file created and readable"

npm run log -- --runId run-20260316T000246Z-b6352c --appId memory-sequence \
  --category validation --checkType "schema-valid" \
  --name "meta.json structure" --result PASS \
  --message "Metadata conforms to required schema"

npm run log -- --runId run-20260316T000246Z-b6352c --appId memory-sequence \
  --category pipeline --step VALIDATE_APP --seq 6 \
  --durationMs 2000 --message "All validation checks passed"

# Step 7: GIT_CHECKOUT_BRANCH
npm run log -- --runId run-20260316T000246Z-b6352c --appId memory-sequence \
  --category pipeline --step GIT_CHECKOUT_BRANCH --seq 7 \
  --durationMs 500 --message "Created feature branch feat/memory-sequence"

# ... continue through all steps ...

# Step 13: MERGE_PR_DEPLOY
npm run log -- --runId run-20260316T000246Z-b6352c --appId memory-sequence \
  --category pipeline --step MERGE_PR_DEPLOY --seq 13 \
  --durationMs 3000 --message "PR merged to main and deployed via Vercel"

# Step 14: TRANSACTION_END
npm run log -- --runId run-20260316T000246Z-b6352c --appId memory-sequence \
  --category pipeline --step TRANSACTION_END \
  --status success --message "Pipeline complete" \
  --details '{"filesCreated":["index.html","meta.json","thumbnail.svg","log.jsonl"],"totalDurationMs":302000,"totalTokens":47300}'
```

---

## Next Steps

1. **Review this recommendation** — Does the architecture align with your vision?
2. **Decide on scope** — Do you want Phase 1+2 first, or add Phase 3 immediately?
3. **Create `scripts/logger.js`** — I can implement this
4. **Update agent instructions** — Rewrite AGENT_PROMPT.md to use the logger
5. **Update frontend** — Add thought display components

This approach transforms logging from a compliance detail into a **featured transparency tool** that showcases agent reasoning and builds user trust.
