# Leaderboard Hook

`app-shell.js` exposes `window.voaLeaderboard` on every page that loads the shell. Use it in games to submit high scores and display the per-game top-10 leaderboard.

---

## API Reference

### `window.voaLeaderboard.submit(score, opts?)`

Opens the leaderboard submit modal with the player's score. The player enters their name, completes a Turnstile bot check, and posts their score to the server. After a successful submission, the top-10 board is shown.

| Parameter    | Type   | Required | Description                                                                          |
| ------------ | ------ | -------- | ------------------------------------------------------------------------------------ |
| `score`      | number | Yes      | Final score (non-negative integer)                                                   |
| `opts.label` | string | No       | Score unit label shown in the modal (e.g. `'pipes passed'`). Defaults to `'points'`. |

**Example:**

```js
// In game-over handler, after voaShare:
if (window.voaLeaderboard) {
  window.voaLeaderboard.submit(score, { label: 'points' });
}
```

---

### `window.voaLeaderboard.show()`

Opens the top-10 leaderboard board view without submitting a score. Useful for viewing existing scores, e.g. attached to a "View Scores" button.

**Example:**

```js
if (window.voaLeaderboard) {
  window.voaLeaderboard.show();
}
```

---

## Adding the Hook to a New Game

1. **In the game-over handler**, call `voaLeaderboard.submit()` after `voaShare`:

   ```js
   function endGame() {
     // ... finalize game state ...

     if (window.voaShare) {
       window.voaShare({ text: `I scored ${score} in My Game! Can you beat it?` });
     }
     if (window.voaLeaderboard) {
       window.voaLeaderboard.submit(score);
     }
   }
   ```

2. **In `meta.json`**, add `maxScore`:

   ```json
   {
     "maxScore": 9999
   }
   ```

   Set this to a plausible upper bound. The API rejects any submission above this value. Think: what is the highest score a skilled-but-human player could realistically achieve? Multiply by 2–3× to allow for exceptional runs without enabling trivially fake scores.

---

## Adding the Hook to an Existing Game

Same as above. After editing `index.html`, update `meta.json` to add `"maxScore": <N>`. Run `npm run generate:apps` to regenerate `data/apps.json`.

---

## Security Model

| Layer                                            | What it does                                                                                                                                                                                                   |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloudflare Turnstile**                         | Bot check on every score submission. Skipped in development (`NODE_ENV === 'development'`).                                                                                                                    |
| **`maxScore` in `meta.json`** / `data/apps.json` | API rejects any score above this value, preventing obvious fake high scores.                                                                                                                                   |
| **Profanity filter** (`bad-words` package)       | Player names are checked server-side. Returns HTTP 422 if a name contains disallowed content.                                                                                                                  |
| **Service role key**                             | All score writes go through the Next.js API route (`POST /api/scores`) using `SUPABASE_SECRET_KEY`, which bypasses RLS. Direct browser writes to Supabase are blocked by RLS policy (no public insert policy). |
| **Input validation**                             | `appId` must match `^\d{4}/\d{2}/\d{2}/[a-z0-9-]+$` and exist in `data/apps.json`. `score` must be a non-negative integer. `playerName` must be 2–20 chars matching `^[a-zA-Z0-9 _\-]+$`.                      |

---

## Database Schema

```sql
create table leaderboard_scores (
  id          bigint generated always as identity primary key,
  app_id      text        not null,
  player_name text        not null,
  score       bigint      not null check (score >= 0),
  created_at  timestamptz not null default now()
);

-- Indexes for fast top-10 queries
create index leaderboard_scores_app_id_score_idx
  on leaderboard_scores (app_id, score desc);

create index leaderboard_scores_app_id_created_at_idx
  on leaderboard_scores (app_id, created_at desc);

-- RLS: anyone can read, no direct public inserts (API route uses service role)
alter table leaderboard_scores enable row level security;
create policy "public read leaderboard"
  on leaderboard_scores for select using (true);
```

Migration file: `supabase/migrations/20260415000000_leaderboard_scores.sql`

---

## API Route Reference

### `GET /api/scores?appId=YYYY/MM/DD/app-id`

Returns the top 10 scores for the given app.

**Response:**

```json
{
  "scores": [
    { "rank": 1, "player_name": "Alice", "score": 420, "created_at": "2026-04-15T..." },
    ...
  ]
}
```

### `POST /api/scores`

Submit a new score.

**Request body:**

```json
{
  "appId": "2026/03/07/flappy-bird",
  "playerName": "Alice",
  "score": 42,
  "turnstileToken": "<token from Turnstile widget>"
}
```

**Success response (201):** Same as GET — returns the updated top 10 for the game.

**Error responses:**
| Status | Condition |
|--------|-----------|
| 400 | Invalid appId, unknown app, invalid score, bad player name, missing Turnstile token |
| 403 | Turnstile verification failed |
| 422 | Player name contains disallowed content |
| 503 | Leaderboard unavailable (missing service role env vars) |

---

## Player Name Persistence

The modal pre-fills the player's name from `localStorage.getItem('${storagePrefix}_player_name')` if set. After a successful submission, the name is saved to the same key. The `storagePrefix` comes from `shell-config.json` (`storagePrefix` field / `NEXT_PUBLIC_STORAGE_PREFIX` env var).

---

## Showcase Page

`/leaderboard` — server-rendered page showing game cards, each with the game's name, thumbnail, and top 3 scores. Only games with at least one score appear. Revalidates every 60 seconds.
