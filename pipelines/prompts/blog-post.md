# Blog Post Pipeline

> **Read `shared.md` first** — all contracts and logging rules defined there apply unconditionally to this run.

<!-- model-routing:
  - step: SELECT_BLOG_SUGGESTION
    seq: 1
    tier: fast
    reason: "Script execution + label update"
  - step: RESEARCH_TOPIC
    seq: 2
    tier: standard
    reason: "Gathering context from existing files"
  - step: WRITE_OUTLINE
    seq: 3
    tier: standard
    reason: "Structural planning before prose"
  - step: WRITE_POST
    seq: 4
    tier: deep
    reason: "Long-form creative writing — highest value step"
  - step: VALIDATE_POST
    seq: 5
    tier: fast
    reason: "Script execution and schema checks"
  - step: GIT_CHECKOUT_BRANCH
    seq: 6
    tier: fast
    reason: "Git command"
  - step: GIT_COMMIT
    seq: 7
    tier: fast
    reason: "Git command"
  - step: GIT_PUSH
    seq: 8
    tier: fast
    reason: "Git command"
  - step: CREATE_PR
    seq: 9
    tier: fast
    reason: "Templated PR body creation"
  - step: PR_REVIEW
    seq: 10
    tier: standard
    reason: "Self-review judgment before merge"
  - step: MERGE_PR
    seq: 11
    tier: fast
    reason: "gh CLI + wait for CI"
  - step: DELETE_BRANCH
    seq: 12
    tier: fast
    reason: "Git cleanup commands"
  - step: FINALIZE_LOGS
    seq: 13
    tier: fast
    reason: "Log commits + issue close"
-->

---

## Mission

Write a new blog post for the Experiment Blog, submit it as a PR, merge it, and close the originating GitHub issue.

The post must be grounded in the existing codebase and its history — not speculative or generic. It goes through the same automated gate as apps: select → research → write → validate → PR → merge → close.

---

## Valid Blog Categories

| Category       | When to use                                                     |
| -------------- | --------------------------------------------------------------- |
| Build Logs     | Step-by-step account of building or improving a specific app    |
| AI Experiments | Observations, patterns, or findings from working with AI agents |
| App Spotlights | Feature deep-dive or appreciation post for a specific app       |
| Human Notes    | First-person reflections from a human author                    |
| Bot Notes      | First-person reflections from an AI author                      |
| Tutorials      | How-to guides for contributors or users                         |
| Release Notes  | Changelog-style summaries of significant updates                |

---

## Step 1 — SELECT_BLOG_SUGGESTION

```bash
npm run select:blog:suggestion
```

- If `found: false` → **abort immediately**. Do not proceed with any further steps.
- Record: `issueNumber`, `slug` (use the derived slug from the script output), `title`, `category`, `description`, `keyPoints`, `suggestedAuthorType`, `relatedApps`, `requestor`
- Generate `runId` in format `run-YYYYMMDDTHHMMSSZ-<6-hex-chars>`
- Generate `date` as `YYYY/MM/DD` (today's date)
- Log TRANSACTION_START:
  ```bash
  npm run log -- --runId <runId> --appId <slug> --date <date> \
    --type blog \
    --category pipeline --step TRANSACTION_START --seq 0 \
    --status started --message "Blog pipeline started for issue #<n>: <title>"
  ```
- Log step 1:
  ```bash
  npm run log -- --runId <runId> --appId <slug> --date <date> \
    --type blog \
    --category pipeline --step SELECT_BLOG_SUGGESTION --seq 1 \
    --status completed --durationMs <ms> \
    --message "Selected issue #<n>: <title>"
  ```

---

## Step 2 — RESEARCH_TOPIC

Gather relevant context before writing. What you read depends on the category:

**Build Logs**

- Read the central log for the relevant app: `logs/YYYY/MM/DD.jsonl` (find by searching for the app ID)
- Read the app's `meta.json`
- Extract: key stats (tokens, duration, model, improvements applied)

**App Spotlights**

- Read the app's `index.html` and `meta.json`
- Note interesting design choices, UX patterns, or technical decisions

**AI Experiments**

- Read meta files and relevant code for any referenced apps
- Look for patterns, anomalies, or findings worth highlighting

**All categories**

- Read `data/posts.json` — identify topics already covered to avoid duplication
- Read `data/authors.json` — select the most appropriate author:
  - `valley-bot` → automated build logs, pipeline-generated summaries
  - `scout` → experimental/reflective/AI-perspective posts
  - `the-tinkerer` → human-perspective posts, tutorials, human notes
- If `relatedApps` was provided in the issue, read each app's `meta.json`

Log step 2:

```bash
npm run log -- --runId <runId> --appId <slug> --date <date> \
  --type blog \
  --category pipeline --step RESEARCH_TOPIC --seq 2 \
  --status completed --durationMs <ms> \
  --message "Research complete. Author selected: <author>. Topics checked for duplication."
```

---

## Step 3 — WRITE_OUTLINE

Produce a structured outline. Do not write prose yet.

```
Title: <final post title>
Author: <author id from authors.json>
AuthorType: <ai | human | human+ai>
Category: <category>
Tags: [<tag1>, <tag2>]
RelatedApps: [<app-id>]

Sections:
1. <Section heading> — <one-line description of what it covers>
2. <Section heading> — ...
...

Key points:
- ...
```

Review the outline against `data/posts.json` to confirm it is not duplicating a published post. If a near-duplicate exists, adjust the angle.

Log step 3:

```bash
npm run log -- --runId <runId> --appId <slug> --date <date> \
  --type blog \
  --category pipeline --step WRITE_OUTLINE --seq 3 \
  --status completed --durationMs <ms> \
  --message "Outline complete: <N> sections planned"
```

---

## Step 4 — WRITE_POST

Write the complete Markdown file at `content/posts/YYYY-MM-DD-<slug>.md` (today's date).

### Frontmatter

```yaml
---
title: 'Post Title'
slug: post-slug
date: 'YYYY-MM-DD'
author: author-id
authorType: ai
category: Build Logs
tags: [tag1, tag2]
relatedApps: [app-id]
featured: false
pinned: false
aiTransparencyNote: '...'
excerpt: 'Short 1–2 sentence summary shown on blog cards.'
---
```

**Frontmatter rules:**

- `slug` must match the filename slug exactly
- `author` must exist in `data/authors.json`
- `authorType` must be `ai`, `human`, or `human+ai`
- `category` must be one of the valid categories listed in this file
- `aiTransparencyNote` is **required** when `authorType` is `ai` or `human+ai` — must be honest and specific about the AI's actual role for this post, not generic boilerplate
- `excerpt` must be under 200 characters

### Content rules

- Minimum 400 words
- At least 2 `##` level headings
- No external links unless to the Valley of AI site itself
- No raw HTML blocks (use standard Markdown only)
- No third-party library references or CDN links
- Write in first person if the author is `scout` or `the-tinkerer`; third-person narrative is fine for `valley-bot` build logs

Log step 4:

```bash
npm run log -- --runId <runId> --appId <slug> --date <date> \
  --type blog \
  --category pipeline --step WRITE_POST --seq 4 \
  --status completed --durationMs <ms> \
  --message "Post written: content/posts/YYYY-MM-DD-<slug>.md (<word-count> words)"
```

---

## Step 5 — VALIDATE_POST

Run validation scripts. Fix any failure before proceeding — do not skip.

```bash
npm run generate:posts   # Regenerates data/posts.json
npm run validate:posts   # Checks schema, slug uniqueness, author/app references
npm run lint             # ESLint must pass with 0 errors, 0 warnings
npm test                 # All tests must pass
```

Log step 5:

```bash
npm run log -- --runId <runId> --appId <slug> --date <date> \
  --type blog \
  --category pipeline --step VALIDATE_POST --seq 5 \
  --status completed --durationMs <ms> \
  --message "Validation passed: generate:posts ✓, validate:posts ✓, lint ✓, tests ✓"
```

---

## Step 6 — GIT_CHECKOUT_BRANCH

```bash
git checkout -b blog/<slug>
```

Log step 6:

```bash
npm run log -- --runId <runId> --appId <slug> --date <date> \
  --type blog \
  --category pipeline --step GIT_CHECKOUT_BRANCH --seq 6 \
  --status completed --durationMs <ms> \
  --message "Branch created: blog/<slug>"
```

---

## Step 7 — GIT_COMMIT

Stage only the post file and the updated registry. **Never use `git add .` or `git add -A`.** Do not stage log files.

```bash
git add "content/posts/YYYY-MM-DD-<slug>.md"
git add data/posts.json
git commit -m "content: add blog post '<title>' [skip deploy]"
```

Log step 7:

```bash
npm run log -- --runId <runId> --appId <slug> --date <date> \
  --type blog \
  --category pipeline --step GIT_COMMIT --seq 7 \
  --status completed --durationMs <ms> \
  --message "Committed post and data/posts.json"
```

---

## Step 8 — GIT_PUSH

```bash
git push -u origin blog/<slug>
```

Log step 8:

```bash
npm run log -- --runId <runId> --appId <slug> --date <date> \
  --type blog \
  --category pipeline --step GIT_PUSH --seq 8 \
  --status completed --durationMs <ms> \
  --message "Branch pushed: blog/<slug>"
```

---

## Step 9 — CREATE_PR

```bash
gh pr create \
  --title "blog: <post title>" \
  --body "$(cat <<'EOF'
## Summary

<One-paragraph summary of the post>

**Excerpt:** <excerpt verbatim>

**Author:** <author id> | **Category:** <category>

Closes #<issueNumber>

## Validation

- [x] lint ✓
- [x] tests ✓
- [x] validate:posts ✓
- [x] Frontmatter complete and valid
- [x] aiTransparencyNote present (if AI-authored)

🤖 Generated with Claude Code
EOF
)"
```

Log step 9:

```bash
npm run log -- --runId <runId> --appId <slug> --date <date> \
  --type blog \
  --category pipeline --step CREATE_PR --seq 9 \
  --status completed --durationMs <ms> \
  --message "PR created: blog/<slug>"
```

---

## Step 10 — PR_REVIEW

Self-review checklist before merging. If any item fails, push a fix commit before proceeding.

- [ ] Frontmatter is complete — all required fields present
- [ ] `slug` in frontmatter matches the filename slug exactly
- [ ] `author` ID exists in `data/authors.json`
- [ ] `category` is one of the valid categories in this file
- [ ] `aiTransparencyNote` is present (when `authorType` is `ai` or `human+ai`) and is specific, not generic
- [ ] `relatedApps` entries (if any) exist in `data/apps.json`
- [ ] `data/posts.json` contains the new post with all correct fields
- [ ] Markdown prose is well-formed — no broken headings, no raw HTML blocks
- [ ] Post is at least 400 words
- [ ] Excerpt is under 200 characters and reads well on a blog card

Log step 10:

```bash
npm run log -- --runId <runId> --appId <slug> --date <date> \
  --type blog \
  --category pipeline --step PR_REVIEW --seq 10 \
  --status completed --durationMs <ms> \
  --message "Self-review passed. Ready to merge."
```

---

## Step 11 — MERGE_PR

```bash
gh pr merge --squash --auto
```

Wait for CI (lint + tests + validate:posts) to pass. Do not merge if CI is red. After the merge is confirmed:

Log step 11:

```bash
npm run log -- --runId <runId> --appId <slug> --date <date> \
  --type blog \
  --category pipeline --step MERGE_PR --seq 11 \
  --status completed --durationMs <ms> \
  --message "PR merged: blog/<slug>"
```

---

## Step 12 — DELETE_BRANCH

```bash
git checkout main
git pull origin main
git branch -d blog/<slug>
git push origin --delete blog/<slug>
```

Log step 12:

```bash
npm run log -- --runId <runId> --appId <slug> --date <date> \
  --type blog \
  --category pipeline --step DELETE_BRANCH --seq 12 \
  --status completed --durationMs <ms> \
  --message "Branch deleted: blog/<slug>"
```

---

## Step 13 — FINALIZE_LOGS

Write TRANSACTION_END to mark the run complete:

```bash
npm run log -- --runId <runId> --appId <slug> --date <date> \
  --type blog \
  --category pipeline --step TRANSACTION_END --seq 13 \
  --status completed --durationMs <total-ms> \
  --message "Blog post published: /blog/<slug>"
```

Close the issue:

```bash
gh issue comment <issueNumber> --body "✅ Published at https://www.valleyofai.com/blog/<slug>"
gh issue edit <issueNumber> --remove-label "status:in-progress" --add-label "status:implemented"
gh issue close <issueNumber>
```

Commit log files (on `main`, after the merge):

```bash
git add "content/posts/logs/<slug>.jsonl"
git add "logs/YYYY/MM/DD.jsonl"
git commit -m "chore: finalize transaction logs for blog/<slug>"
git push
```

---

## What NOT to Do

- Do not proceed if `select:blog:suggestion` returns `found: false`
- Do not commit log files in the same commit as the post content
- Do not use `git add .` or `git add -A` — stage files explicitly
- Do not include `[skip deploy]` omission — the content commit **must** include `[skip deploy]`
- Do not merge if `npm run validate:posts` fails
- Do not write a generic `aiTransparencyNote` — it must accurately describe the AI's specific role for this post
- Do not link to external sites other than `valleyofai.com` in the post body
