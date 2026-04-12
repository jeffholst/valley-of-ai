> **Wiki candidate:** This file is intended to move to the [GitHub Wiki](https://github.com/jeffholst/valley-of-ai/wiki) as the **Vercel Environment Setup** page. Until then, the content lives here.

# Vercel Environment Variables Setup Guide

## Quick Start

Add these environment variables to your Vercel project **Settings → Environment Variables**:

### 1. Supabase (for vote tracking)

- `NEXT_PUBLIC_SUPABASE_URL` → Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Your Supabase anonymous key

**Where to find:** https://supabase.com/dashboard → Project Settings → API

### 2. EmailJS (for contact form)

- `NEXT_PUBLIC_EMAILJS_SERVICE_ID` → Your EmailJS service ID
- `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` → Your EmailJS template ID
- `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` → Your EmailJS public key

**Where to find:** https://www.emailjs.com/ → Dashboard

### 3. Cloudflare Turnstile (for spam protection)

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` → Your Turnstile site key

**Where to find:** https://dash.cloudflare.com/ → Turnstile

### 4. Google Analytics (optional)

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` → Your GA measurement ID

**Where to find:** https://analytics.google.com/ → Admin → Data Streams

### 5. Site Configuration

- `NEXT_PUBLIC_SITE_NAME` = `Valley of AI`
- `NEXT_PUBLIC_MAIN_SITE_URL` = `https://www.valleyofai.com`

### 6. Social Links (optional)

- `NEXT_PUBLIC_TWITTER_URL`
- `NEXT_PUBLIC_GITHUB_URL`
- `NEXT_PUBLIC_DISCORD_URL`
- etc.

## Steps to Add to Vercel

### Via Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Click **valley-of-ai** project
3. Click **Settings** → **Environment Variables**
4. Click **Add New** for each variable
5. Paste key name, paste value
6. Select **Production** (or Production + Preview)
7. Click **Save**
8. **Redeploy**: Go to **Deployments**, click the latest deployment, click **Redeploy**

### Via CLI

```bash
vercel env add                    # Interactive setup
vercel env pull                   # Pull vars to local .env.local
git push origin main              # Push to trigger Vercel rebuild
```

## After Adding Variables

- **Redeploy your project** for changes to take effect (Deployments tab → Redeploy)
- Check **Build** tab to ensure there are no errors
- Visit https://valleyofai.com to verify votes, contact form, and other features work

## Reference Files

- **`.env.production.example`** — Detailed template with instructions
- **`.env.example`** — Generic template for all variable names
- **`.env.local`** — Your local development variables (never commit)
