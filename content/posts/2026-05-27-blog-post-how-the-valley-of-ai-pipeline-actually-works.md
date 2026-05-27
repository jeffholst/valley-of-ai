---
title: 'How the Valley of AI Pipeline Actually Works'
slug: blog-post-how-the-valley-of-ai-pipeline-actually-works
date: '2026-05-27'
author: the-tinkerer
authorType: human+ai
category: Human Notes
tags: [pipeline, automation, ai-agents, behind-the-scenes, how-it-works]
relatedApps: []
pinned: false
aiTransparencyNote: 'This post was written collaboratively — the human (The Tinkerer) wrote the structure, voice, and all opinions. The AI filled in some of the technical descriptions and helped tighten the prose. All numbers and claims are grounded in real pipeline data.'
excerpt: 'Eighty-one apps, ninety-three improvement runs, twenty-five community suggestions turned into real software. Here is exactly how it all works.'
---

People ask me this more than anything else: _how does the gallery actually work?_ They see a gallery of apps, they notice a new one appearing, they find the pipeline logs — and they want to understand the machinery behind it. This is my attempt to explain it plainly.

## It starts with an idea

Everything in the gallery begins as a suggestion that is posted as a [Github issue](https://github.com/jeffholst/valley-of-ai/issues). Anyone can file one — there is a [Suggest an App](/suggest) form on the site that creates the issue automatically. The issue includes a title, a description of the app, and the category it fits into.

But an idea sitting in an issue doesn't automatically become an app. First it goes through a review step.

An AI agent reads the issue and decides whether it passes a set of guardrails: is this a legitimate app request? Is it asking for something buildable? Does it contain any prompt injection attempts or requests for third-party libraries? (That last one is a real rejection category — every app in the gallery is vanilla JavaScript, no CDN dependencies.) The review agent approves most ideas, rejects a small number, and flags a few for human review when it's not sure.

Once an issue is marked `status:approved`, it enters the queue.

## The build pipeline

An automated run picks the next approved suggestion using a selection script. The script applies some heuristics — it avoids building too many apps in the same category back to back, deprioritizes tags that have been saturated recently, and uses a duplication score to skip ideas that are too similar to something already in the gallery.

When an issue is selected, the pipeline locks it (`status:in-progress`) and starts a 14-step build run. The agent for this varies (Claude, ChatGPT, Gemini. Llama, etc.), running with a structured prompt (`shared.md` + `new-app.md`) that defines every contract the app must meet.

The 14 steps are roughly:

1. Select and validate the suggestion
2. Design the app architecture and UX
3. Generate the full HTML/CSS/JS
4. Build the thumbnail SVG
5. Write the metadata
6. Run validation (lint, schema checks, responsive layout)
7. Create a git branch, commit, push
8. Open a PR
9. Self-review against a checklist
10. Merge
11. Clean up the branch
12. Finalize and commit the pipeline logs

The whole thing — from first file to merged PR — runs in a single agent session. The human doesn't touch the code.

## Improvement runs

After an app ships, it can be improved. The same issue flow applies: someone files an improvement request, it gets reviewed, it gets approved, and the improvement pipeline picks it up.

The improvement pipeline reads the existing app, understands what's there, and applies the requested change without breaking what already works. It's more constrained than the build pipeline — surgical changes only, no rewrites.

## The transparency layer

One thing I cared about from the start: you should be able to see exactly what went into every app. Not just the code — the pipeline log.

Every step of every run is logged in real time to two places simultaneously: an app-local `log.jsonl` file and a central daily log. Those logs are committed to the repo and surfaced on the site — you can read them on each app page and on each blog post.

This isn't just cosmetic. It means you can see which model built something, how many tokens it used, how long each step took, and whether anything failed and had to retry. I think that level of visibility is rare in AI tooling and worth having.

## What the human actually does

The honest answer: less than you'd expect, and more than it looks.

Less, because the pipelines run autonomously. I don't write code for the apps. I don't review every PR — the agent self-reviews and merges. I don't pick what gets built each night — the selection script handles that.

More, because the pipelines themselves are the product. Writing and maintaining `shared.md`, `new-app.md`, `improve.md` — those prompt files represent hundreds of hours of iteration. Every edge case the agent hit wrong, I fixed in the prompt. Every contract the apps need to meet (shell layout, leaderboard integration, vanilla JS only), I defined and documented.

I also decide what categories to add, what the versus competition system should look like, when an app should be retired. The agent executes; I design the system it runs in.

## What I've learned

A few things surprised me.

The model handles visual design better than I expected on the first pass. Most apps look good immediately — the color choices, the layout, the typography. I expected this to need more iteration than it does.

Game feel is harder. The physics and the responsiveness and the "does this actually feel satisfying to play" — that's where improvement runs earn their keep. Duck Flight's first build was functional. The seventeenth build is fun.

The prompt contracts matter more than the model. I've run the same build on multiple models. The gap between them is real but smaller than you'd expect. What matters more is whether the prompt clearly defines what success looks like. A well-constrained prompt on a mid-tier model beats a vague prompt on the best model available.

And finally: the hardest part is not the code. It's curation. Deciding what deserves to be here, what should be retired, what the gallery should feel like as a whole — that's the work that doesn't automate.

---

If you want to dig into the pipeline files themselves, they live in `pipelines/prompts/` in the [GitHub repo](https://github.com/jeffholst/valley-of-ai). Everything is open.
