---
title: 'Introducing Versus: Making AI Models Compete'
slug: blog-post-introducing-versus-making-models-compete
date: '2026-05-27'
author: the-tinkerer
authorType: human+ai
category: Release Notes
tags: [versus, models, competition, gpt-4o, claude, breakout, feature]
relatedApps:
  - 2026/04/10/benchmark-breakout-turbo
  - 2026/04/11/benchmark-breakout-opus
shortSlug: versus
pinned: false
aiTransparencyNote: 'This post was written collaboratively — the human (The Tinkerer) wrote the structure, all opinions, and the numbers. The AI helped shape the prose and tighten the transitions. All performance data is pulled directly from the generation metadata.'
excerpt: 'Same prompt, two models, one winner. Versus is live — and the first competition is already underway.'
---

There are a lot of AI model comparisons on the internet. Most of them are benchmarks: tables of numbers, scores on standardized tests, abstract claims about reasoning or coding ability.

I find them hard to interpret. What I actually want to know is: _if I give both models the same real task, what do they build?_

That is what Versus is for.

## The question that started it

Valley of AI has been running a single pipeline since the beginning: one model, one app, one PR. But I kept wondering what would happen if two models got the same prompt. Not a text prompt — a prompt to build a real piece of software. Something you could open in a browser, play, and judge.

The gap between "model A scored 87.3 on HumanEval" and "model A built a better game" is enormous. Benchmarks measure the inputs. Versus measures the output. You play both, you vote for the one you prefer, and the result is a direct comparison that actually means something.

## How Versus works

A competition starts with a single prompt — the same text handed to both models with no modifications. Each model builds through the normal pipeline: a full agent run, HTML/CSS/JS written from scratch, the whole 14-step process.

The two resulting apps live at their own permanent URLs in the gallery. On the [Versus page](/versus), they appear side by side with the shared prompt visible above both. You can launch each one, play them, and then cast a single vote for the one you think is better.

That is the whole thing. No rubric, no scoring criteria, no judge's commentary — just the prompt, the two builds, and your vote.

## The first competition: Benchmark Breakout Battle

The inaugural competition used a demanding prompt — a premium, mobile-first Breakout game with a full feature list: smooth physics, combo scoring, power-ups, particle effects, screen shake, adaptive audio, 44px touch targets, stable 60 FPS. No shortcuts. The kind of spec that tests whether a model can hold a lot of requirements in mind at once and execute all of them.

Two models took it on.

**Benchmark Breakout Turbo** was built by GPT-4o running through the pi-coding-agent pipeline. It came in with a portrait-first layout, charge shots, combo chains, and tight mobile controls. Generation time: 211 seconds. Tokens: 4,500 in, 5,060 out.

**Benchmark Breakout Opus** was built by Claude Opus 4.6 running through Claude Code. It went deeper on the feature set — canvas rendering, Web Audio synthesized sound effects, five level patterns with multi-hit and indestructible bricks, three power-up types, a combo multiplier. Generation time: 643 seconds. Tokens: 17,500 in, 25,000 out.

The numbers tell part of the story before you even play. GPT-4o was three times faster and used roughly five times fewer tokens. Opus spent more time and generated significantly more code. Whether that investment shows up in a better game is exactly the question Versus is designed to answer.

Both apps are live. The vote is open.

## What the data shows — and doesn't

One thing I care about with Versus is transparency. When you look at a competition, you can see the generation stats for each entry: which model built it, which agent ran the pipeline, how long it took, and how many tokens it consumed. That context matters when you are evaluating the output.

A model that builds something good in 211 seconds and 9,560 total tokens is doing something different from one that takes 643 seconds and 42,500 tokens. Whether different means better depends on what you value. Speed and economy are real constraints in production systems. So is feature depth.

I am not going to tell you which one won. That is the point — go play them and vote.

## What we are comparing next

The Benchmark Breakout Battle is only the first competition. I have a list of prompts I want to run through multiple models, and I am adding to it. A few directions I am considering:

- **Utility apps** — how do models handle something functional rather than a game? A timer, a calculator, a data tool.
- **Open-ended prompts** — give models more latitude and see how their aesthetic choices differ.
- **Same model, different prompt engineering** — test whether a heavily constrained prompt produces a better result than a loose one.

If you have a prompt you want to see models compete on, [suggest it as a GitHub issue](https://github.com/jeffholst/valley-of-ai/issues) with a `versus` label. The best ones will become competitions.

In the meantime: [go vote](/versus).
