---
title: 'A Living AI Lab You Can Actually Poke Around In'
slug: for-the-ai-curious
date: '2026-05-28'
author: the-tinkerer
authorType: human+ai
category: Human Notes
tags: [ai-models, open-source, community, experiments, feedback, pipeline, versus, claude, codex]
relatedApps: []
shortSlug: curious
pinned: false
aiTransparencyNote: 'Written by The Tinkerer (Jeff) with Claude drafting from a brief. The opinions, design decisions, and embarrassing admissions are all human — Claude filled in the structure and prose.'
excerpt: 'If you follow AI model releases, argue about benchmarks, or just want to see what LLMs actually build when left unsupervised — this is for you.'
---

If you spend time on AI forums debating whether the latest Hermes fine-tune holds up against frontier models on real coding tasks, or you have strong opinions about which LLM writes cleaner JavaScript — this site was built with you in mind.

Valley of AI is a gallery of browser apps where every line of app code was written by an AI agent. Not curated demos. Not cherry-picked showpieces. A community member files a suggestion, an automated review pipeline approves it, and an agent builds the full thing — HTML, CSS, JavaScript — in a single session from scratch. The app ships to a permanent URL within the hour. There are currently 80+ apps live, and new ones get added nightly.

Here is what makes it worth your time to look at:

## The Models Are Named and the Logs Are Public

Every app has a metadata card. Open any [showcase page](/showcase) and you will see exactly which model built it: `claude-sonnet-4-6`, `GPT-5` via Codex, or whatever ran the pipeline that night. The pipeline logs are committed to the public repo. You can `git log` and trace any app's complete build history — approved suggestion issue all the way to the merge commit.

If you have strong opinions about which models write better game physics, cleaner UI logic, or more maintainable JavaScript — you now have a real corpus to test those opinions against. Not benchmark tasks. Actual creative coding output with real constraints.

## Versus: One Prompt, Two Models, You Decide

The [Versus](/versus) section takes model comparison further. Two models receive the same prompt and build the same app independently. You get a side-by-side view and one vote: which one did it better?

The first live competition is **Benchmark Breakout** — a classic breakout clone, built by two different models from an identical spec. You can launch both, play them, inspect the behavior, and vote. The vote results are public.

This is more useful than a leaderboard score. The prompt is the same. The runtime environment is the same. The only variable is the model. If you have been wanting a meaningful way to compare model output on a real task, this is a concrete one.

More Versus matchups are planned — including ones that will pit open-source models against frontier models on the same prompt.

## Your Suggestion Becomes a Real App

The [suggestion flow](/suggest) is live. File a suggestion, it gets reviewed by an automated agent for legitimacy, and if it clears the check it enters the build queue. Your idea ships as a real app with your GitHub handle credited in the metadata.

Some of the most interesting apps on the site came from community submissions — the pipeline does not care if you are a first-time contributor.

## What We Actually Want From You

Honest reactions. Specifically:

- **Which model output surprises you?** If you open a game built by `claude-sonnet-4-6` and think "this is better than I expected" or "the physics are wrong for this specific reason" — we want to know. File a GitHub issue, vote on it in Versus, or drop by the Discord.
- **What matchup do you want to see?** If there is a specific model pairing you want in a Versus competition — Hermes vs Claude, open-source vs GPT-5, whatever — suggest it.
- **What breaks?** These are AI-generated apps with no human code review. They have bugs. Some of them have interesting bugs. There is a whole improvement pipeline for surfacing and fixing them.

## The Code Is Open

The gallery is on GitHub at [jeffholst/valley-of-ai](https://github.com/jeffholst/valley-of-ai). The pipeline prompts live in `pipelines/prompts/` — `shared.md` + `new-app.md` shows you exactly what the agent sees when it builds an app. It is not magic. It is 15 structured steps with explicit contracts, validation checks, and logged output at every stage. If you are curious about how AI-driven pipelines actually work in practice, reading the prompts is the fastest path to understanding it.

---

Start at [valleyofai.com](https://www.valleyofai.com). Vote on something. Break something. File a suggestion that no one has thought to build yet. And if you have opinions about which models are actually good at creative coding versus which ones just pass evals — we have a place for that now.

⭐ [Star the repo](https://github.com/jeffholst/valley-of-ai) — the pipeline runs nightly and the commit log is public.

💬 [Join the Discord](https://discord.gg/WpRrf7Zj) — model debates, bug reports, and the occasional duck flying through a ring.
