# Security Policy

## Supported Versions

| Version              | Supported |
| -------------------- | --------- |
| latest (main branch) | ✅        |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

To report a vulnerability, open a
[GitHub Security Advisory](https://github.com/jeffholst/valley-of-ai/security/advisories/new)
(private disclosure). Include as much detail as possible:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested remediation

You can expect an acknowledgment within **72 hours** and a status update within **7 days**.

## Scope

In scope:

- XSS, CSRF, or injection vulnerabilities in the Next.js app
- Exposed secrets or credentials in the codebase
- Authentication or authorization bypasses (Supabase, Stripe)
- Issues in the AI agent pipeline that could be exploited via prompt injection in user-submitted content

Out of scope:

- Vulnerabilities in third-party services (Supabase, Vercel, Stripe, Cloudflare) — report those directly to the vendor
- Rate-limiting or denial-of-service on public endpoints
- Self-XSS or issues requiring physical access to a device

## Preferred Languages

Reports in English are preferred.
