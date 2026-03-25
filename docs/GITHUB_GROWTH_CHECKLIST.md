# GitHub Growth Checklist

A checklist for growing Valley of AI into a highly-starred GitHub repository.
Work through these roughly in order — high-impact items come first.

---

## 1. Discoverability — GitHub Repository Settings

- [ ] Add GitHub Topics to the repo (Settings → Topics):
      `ai-generated`, `nextjs`, `ai-agents`, `claude`, `gallery`, `automated`, `vercel`, `javascript`, `anthropic`, `llm`
- [ ] Confirm the repo description is set (one punchy sentence, e.g. _"A gallery of 200+ apps built nightly by AI agents — zero human app code"_)
- [ ] Pin this repo on your GitHub profile page

---

## 2. README — First Impression

- [ ] Add an animated GIF or screenshot carousel near the top showing 3–4 of the most visually impressive apps
  - Use [Gifox](https://gifox.app), [Kap](https://getkap.co), or a browser screen recorder
  - Target: 600–800px wide, under 5 MB, looping
- [ ] Add a live metrics badge row just below the hero image:
  - Total apps built (can be a static badge updated in CI, e.g. `shields.io/badge/Apps Built-213-blueviolet`)
  - "0 human-written app lines" or similar
  - Days running / since date
- [ ] Add a "How It Works" section with a step-by-step pipeline summary:
  1. Community submits idea via GitHub Issue
  2. AI review agent checks for safety + legitimacy
  3. Approved issue queued for nightly build
  4. Claude agent builds app in 14 steps (writes HTML, thumbnail, meta, logs)
  5. PR auto-opened, merged, deployed to Vercel
  - Optionally add a simple ASCII or Mermaid flowchart
- [ ] Link to `docs/agent-prompts/` prominently — developers building their own Claude pipelines will star the repo just for these
- [ ] Confirm the Featured Apps table stays up to date (remove stale entries, add standout recent apps)

---

## 3. Show HN Submission

This is likely the single highest-leverage action.

- [ ] Draft a Show HN post (plain text, no markdown):
  - First line: `Show HN: A gallery where AI agents build and deploy new apps every night`
  - Body (3–5 short paragraphs):
    - What it is and the live URL
    - How the pipeline works end-to-end (issue → AI review → Claude builds → PR → Vercel)
    - Technical details: Claude agent, 14-step pipeline, JSONL logs, zero human app code
    - Invite: "Suggest an app, it might be live tomorrow"
  - Link: `https://github.com/jeffholst/valley-of-ai`
- [ ] Time the post: aim for a weekday 8–10 AM US Eastern (peak HN traffic)
- [ ] Monitor comments for the first hour and respond quickly — early engagement drives ranking

---

## 4. Reddit Posts

Post separately to each community — tailor the title and framing per subreddit.

- [ ] **r/artificial** — focus on "AI builds and deploys apps autonomously every night"
- [ ] **r/webdev** — focus on the tech stack and the automated pipeline
- [ ] **r/MachineLearning** — focus on the agentic workflow and prompt engineering
- [ ] **r/nextjs** — focus on the Next.js gallery + Vercel deployment architecture
- [ ] **r/ClaudeAI** — share the agent prompts and pipeline as a real-world example

For each post:

- [ ] Use a direct, specific title (avoid vague "I built X" — say what makes it interesting)
- [ ] Include a screenshot or GIF inline
- [ ] Link both the live site and the GitHub repo
- [ ] Respond to every comment within the first few hours

---

## 5. Developer Hooks — Agent Prompts

- [ ] Add a dedicated **"AI Pipeline"** section to the README that calls out `docs/agent-prompts/` as a working, production example of a Claude multi-step agent
- [ ] Add brief inline descriptions to each prompt file so developers scanning the repo understand their purpose at a glance
- [ ] Consider a short blog post or gist walking through the 14-step new-app pipeline — link it from the README

---

## 6. Social & Community

- [ ] Set up an auto-post when a new app is deployed:
  - Trigger: PR merged to `main` with a `feat/` branch prefix
  - Post to X/Twitter: app name, screenshot/thumbnail, live link, and `#ValleyOfAI`
  - Can use a GitHub Action + X API or a simple Zapier/Make workflow
- [ ] When a suggested issue gets built, post a comment on the original GitHub issue notifying the suggester with the live link — people share things they participated in creating
- [ ] Add Valley of AI to:
  - [ ] [Awesome Claude](https://github.com/anthropics/awesome-claude) (if eligible)
  - [ ] [Awesome AI Tools](https://github.com/mahseema/awesome-ai-tools)
  - [ ] Product Hunt (full launch when the app count is impressive, e.g. 250+)

---

## 7. Ongoing Signals (Keeps the Repo Alive)

- [ ] Maintain a visible `CHANGELOG.md` or a "Recent Builds" section — shows the project is active
- [ ] Ensure the GitHub commit graph stays green (nightly pipeline commits do this naturally)
- [ ] Periodically update the Featured Apps table in the README with fresh standout apps
- [ ] Watch GitHub Stars count and note which posts/launches drove spikes — double down on what worked

---

## Priority Order (if doing this incrementally)

1. GitHub Topics + repo description (10 min, immediate discoverability)
2. Screenshot/GIF in README (1 hour, improves first impression before any traffic arrives)
3. Show HN post (highest single-event traffic potential)
4. Reddit posts (sustained traffic over days)
5. Agent prompt callout in README (targets the developer audience most likely to star)
6. Auto-post new apps on X (compounds over time)
7. Community site submissions (Product Hunt, Awesome lists)
