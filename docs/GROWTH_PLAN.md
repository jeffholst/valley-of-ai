# Growth + Community Implementation Plan

This document breaks the viral growth and community roadmap into checkable tasks. Each item is designed to be completed independently and validated before moving on.

## How To Use

- Work top-to-bottom unless a dependency blocks a task.
- Keep each item small and shippable.
- After each task, validate locally and note any follow-up in a short PR description.

## Phase 1: Viral Sharing (Fast Impact)

### 1.1 Add per-app social metadata

- [x] Implement per-app `generateMetadata()` for `/showcase/[...id]` to set:
  - `title`, `description`
  - `openGraph` with `images` and `url`
  - `twitter` card with `images` and `title`
- [x] Ensure image URLs resolve to existing app thumbnails
- [ ] Verify with a sample app URL using a share preview checker

### 1.2 Add share action on app detail page

- [x] Add a Share button on the app detail page
- [x] Use Web Share API when available; fall back to clipboard copy
- [x] Include the app title and URL in the share payload
- [ ] Track share click event (wire in analytics later)

### 1.3 Add share action on versus detail page

- [x] Add a Share button on the versus detail page
- [x] Include shared prompt + versus URL in the payload
- [x] Provide clipboard fallback

## Phase 2: Discoverability + Session Depth

### 2.1 Add Trending sort option

- [x] Add a new sort option in gallery filters
- [x] Decide signal (initially: recent votes + recency)
- [x] Document the formula in code comments

### 2.2 Implement trending sort logic

- [x] Compute trending score from app data (vote velocity + recency)
- [x] Use a conservative fallback if data is missing
- [x] Add a unit test for ranking stability

### 2.3 Add Similar Apps section

- [x] On app detail, show 4-6 similar apps
- [x] Similarity rule: same category, then shared tags, then recency
- [x] Exclude current app from results

### 2.4 Add Featured/Trending section to home

- [ ] Add a small horizontal section above the gallery
- [ ] Use trending list for now; allow manual override later

## Phase 3: Community Onboarding

### 3.1 Add community links in footer

- [ ] Add Discord link to footer social links
- [ ] Add GitHub Discussions link to footer and README

### 3.2 Add first-visit "How it works" modal

- [ ] Show on first visit only (localStorage)
- [ ] Explain the loop: suggest -> build -> improve
- [ ] Include links to Suggest and Improve pages

## Phase 4: Retention Loops

### 4.1 Add Favorites (localStorage)

- [ ] Add a "Save" action on app cards and detail
- [ ] Store saved app IDs in localStorage
- [ ] Add visual state for saved apps

### 4.2 Add "My Favorites" page

- [ ] Add a route that lists saved apps
- [ ] Handle empty state with a CTA to browse

### 4.3 Add "My History" page

- [ ] Show user votes and suggestions made from this device
- [ ] Make it optional; do not block if data missing

## Phase 5: SEO + Distribution

### 5.1 Ensure sitemap includes dynamic routes

- [ ] Verify `/showcase/[id]` and `/versus/[id]` are in sitemap
- [ ] Add missing entries if required

### 5.2 Add RSS feed endpoint

- [ ] Add `/api/feed.xml` for latest apps
- [ ] Include title, description, date, and link for each item

### 5.3 Add embeddable widget

- [ ] Create a minimal embed showing "App of the day" or "Random app"
- [ ] Provide iframe snippet on a docs page

## Phase 6: Analytics + Growth Tracking

### 6.1 Add analytics helper

- [ ] Create a small helper to send GA events
- [ ] Centralize event names in one file

### 6.2 Track core funnel events

- [ ] App open
- [ ] Share click
- [ ] Suggestion submit
- [ ] Vote
- [ ] Favorite save

### 6.3 Track form funnels

- [ ] Suggest: view -> submit -> success
- [ ] Improve: view -> submit -> success

## Phase 7: Governance + Community Trust

### 7.1 Add contribution ladder doc

- [ ] Define levels: Contributor -> Trusted -> Core
- [ ] Explain how to advance

### 7.2 Add community values doc

- [ ] Short values and expectations
- [ ] Link from README and footer

### 7.3 Add "In Development" tracker section

- [ ] Show count of pending suggestions/improvements
- [ ] Link to GitHub issues with filters

## Optional Later Enhancements

- [ ] Add leaderboards for top contributors
- [ ] Add user profile pages
- [ ] Add referral attribution (`?ref=`) to track shares
- [ ] Add growth experiments log
