> **Wiki candidate:** This file is intended to move to the [GitHub Wiki](https://github.com/jeffholst/valley-of-ai/wiki) as the **Fork & Deploy Your Own Instance** page. Until then, the content lives here.

# Fork Setup Checklist

A step-by-step guide for anyone who forks this project to build their own
AI-generated app gallery. Work through the sections in order.

---

## Before You Start

### What you'll need

- Your own domain name
- A GitHub account and repo for your fork
- A Vercel account (or other Next.js-compatible host)
- A Supabase project (for voting)
- Cloudflare Turnstile keys (for the suggestion form bot protection)
- Stripe account (optional — only if you want donations/tips)
- Google Analytics measurement ID (optional)

### Quick orientation

Most branding is now driven entirely by environment variables — no code changes
needed for the gallery app itself. The two layers to handle are:

1. **Env vars** — set these and the site name, domain, author, emoji, social links, and
   storage keys all update automatically everywhere
2. **Static content** — README, docs, and brand image assets that reference this project
   by name still need manual updates (find-and-replace)

---

## Step 1 — Repository Setup

- [ ] Fork the repo on GitHub
- [ ] Rename the repo to something that reflects your project (Settings → Repository name)
- [ ] Update `package.json` line 2: `"name": "your-project-name"`
- [ ] Delete `public/CNAME` and recreate it with your own domain if deploying to GitHub Pages,
      or delete it entirely if using Vercel with a custom domain

---

## Step 2 — Environment Variables

Copy `.env.example` to `.env` and fill in every value. **This single step handles most
of the branding** — site name, domain, emoji, author, social links, and localStorage keys
all flow from here automatically.

### Branding (replaces all "Valley of AI" copy in the app)

- [ ] `NEXT_PUBLIC_SITE_NAME` — your gallery's name
- [ ] `NEXT_PUBLIC_SITE_DESCRIPTION` — one-line tagline shown in page metadata
- [ ] `NEXT_PUBLIC_SITE_EMOJI` — emoji shown in the header and footer (default: 🤖)
- [ ] `NEXT_PUBLIC_SITE_AUTHOR` — your name for the footer credit line (leave unset to hide it)
- [ ] `NEXT_PUBLIC_MAIN_SITE_URL` — your full domain, e.g. `https://www.your-domain.com`
- [ ] `NEXT_PUBLIC_STORAGE_PREFIX` — short slug used as localStorage key prefix, e.g. `myapp`
      (prevents vote data collisions if multiple forks run in the same browser)

### Infrastructure (required)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — from your Supabase project settings
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your Supabase project settings
- [ ] `GITHUB_REPO` — `your-github-username/your-repo-name`
- [ ] `GITHUB_SUGGESTIONS_TOKEN` — a GitHub personal access token with `repo` scope

### Recommended

- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` — your Google Analytics 4 measurement ID
- [ ] `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile secret (bot protection on the suggestion form)
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — Cloudflare Turnstile site key

### Social links (used by the app shell footer)

- [ ] `NEXT_PUBLIC_GITHUB_URL` — your GitHub repo URL
- [ ] `NEXT_PUBLIC_SOCIAL_X_URL` — your X/Twitter profile URL
- [ ] `NEXT_PUBLIC_SOCIAL_FACEBOOK_URL` — your Facebook page URL (leave unset to hide)
- [ ] `NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL` — your Instagram URL (leave unset to hide)

### Optional (Stripe donations)

- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

> Also set all of the above in Vercel (or your host's) environment variable dashboard —
> they don't read from `.env` at build time in production.

---

## Step 3 — Find-and-Replace in Static Content

The gallery app code is fully env-var driven, but README and docs still contain
hardcoded project references. Run these substitutions globally:

| Find                     | Replace with                               |
| ------------------------ | ------------------------------------------ |
| `jeffholst/valley-of-ai` | `your-github-username/your-repo-name`      |
| `jeffholst`              | `your-github-username`                     |
| `valleyofai.com`         | `your-domain.com`                          |
| `www.valleyofai.com`     | `www.your-domain.com`                      |
| `Valley of AI`           | Your site name                             |
| `valley-of-ai`           | `your-repo-name` (where used as a slug/id) |

Files affected:

- [ ] `README.md` — badges, clone URL, links, featured apps table
- [ ] `docs/VERCEL_ENV_SETUP.md`
- [ ] `docs/agent-prompts/AGENT_PROMPT_IMPROVEMENT.md`
- [ ] `docs/agent-prompts/archive/single_prompt.md` (if keeping the archive)

---

## Step 4 — Brand Assets

- [ ] `public/valley-hero.svg` — the hero banner image in the README and site header;
      replace with your own or edit the text inside it
- [ ] `public/favicon.ico` and any `public/apple-touch-icon*` files — replace with your own
- [ ] Review `public/` for any other Valley-specific images

---

## Step 5 — Agent Prompts (if using the AI pipeline)

The prompts under `docs/agent-prompts/` contain narrative copy specific to Valley of AI.
If running your own nightly pipeline:

- [ ] `AGENT_PROMPT_SHARED.md` — update any references to the site name and domain
- [ ] `AGENT_PROMPT_NEW_APP.md` — update project name in any example log messages
- [ ] `AGENT_PROMPT_IMPROVEMENT.md` — verify the app URL pattern is correct for your domain
- [ ] `AGENT_PROMPT_ISSUE_REVIEW.md` — review for any Valley-specific guardrail language
- [ ] `guardrails.example` — adapt content policy language for your community

---

## Step 6 — Supabase Setup

- [ ] Create a new Supabase project
- [ ] Run the schema from `supabase/` (check for any migration files)
- [ ] Add your Supabase URL and anon key to `.env` and Vercel env vars
- [ ] Confirm RLS policies are set correctly for your use case

---

## Step 7 — GitHub Repository Configuration

- [ ] Update or replace the issue templates in `.github/ISSUE_TEMPLATE/` if needed
- [ ] Update `.github/pull_request_template.md` if needed
- [ ] Set GitHub repo Topics relevant to your project
- [ ] Update the repo description on GitHub

---

## Step 8 — Final Verification

- [ ] Run `npm install` and `npm run dev` — confirm the site loads with your branding
- [ ] Run `npm run lint` — must pass with 0 warnings
- [ ] Run `npm test` — all tests should pass
- [ ] Run `npm run build` — confirm production build succeeds
- [ ] Check the suggestion form — confirm Turnstile loads (or is skipped gracefully in dev)
- [ ] Check the voting buttons on an app — confirm votes persist and Supabase is connected
- [ ] View page source and confirm no `valleyofai.com` or `jeffholst` strings remain

---

## What You Do NOT Need to Change

- `__PLACEHOLDER__` tokens inside `apps/*/index.html` — replaced at build/sync time automatically
- `lib/siteConfig.js`, `components/Header.jsx`, `components/LayoutShell.jsx`,
  `app/layout.jsx`, `app/robots.js`, `app/sitemap.js`, `app/api/improvements/route.js`,
  `app/api/stripe/checkout/route.js`, `hooks/useVotes.js`, `apps/shared/app-shell.js` —
  all driven by env vars, no code changes needed
- The `voa-` prefix on HTML meta tag names (e.g. `voa-app-id`) — internal attribute names
  read by `app-shell.js`; changing them requires coordinated edits across every generated app
- `npm run log` format and JSONL schema — generic
- The core pipeline scripts in `scripts/issues/` — project-agnostic

---

## After Launch

- [ ] Update `README.md` badges, clone URL, and featured apps list
- [ ] Consider adding a "Inspired by Valley of AI" attribution line — not required, but appreciated
