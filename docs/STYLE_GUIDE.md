# Valley of AI — Style Guide

## Overview

This document defines the coding standards, conventions, and best practices for the Valley of AI project. All contributors must adhere to these guidelines to maintain code quality, consistency, and readability.

## Tooling

### ESLint
We use ESLint to enforce code quality rules and catch common mistakes.

```bash
npm run lint           # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
```

**Config:** `.eslintrc.json` — extends `next/core-web-vitals`

### Prettier
We use Prettier for opinionated code formatting to eliminate style debates.

```bash
npm run format        # Format all files
```

**Config:** `.prettierrc.json`

---

## JavaScript/JSX Conventions

### Variable Declaration
- Use `const` by default, `let` if reassignment is needed, never use `var`
- Use camelCase for variable and function names
- Use UPPER_SNAKE_CASE for constants

```js
// ✅ Good
const maxRetries = 3;
const handleClick = () => {};
const API_KEY = 'secret';

// ❌ Bad
var maxRetries = 3;
let MAX_RETRIES = 3;
const handleclick = () => {};
```

### Naming Conventions
- Component names: **PascalCase** (`Header.jsx`, `AppCard.jsx`)
- Hook names: Start with **use** (`useVotes.js`, `useTheme.js`)
- Event handlers: Prefix with **on** (`onClick`, `onChange`, `onSubmit`)
- Boolean variables: Prefix with **is**, **has**, **should** (`isLoading`, `hasError`, `shouldFetch`)

```js
// ✅ Good
const isVisible = true;
const handleSubmit = (e) => {};
const hasVoted = checkVote();

// ❌ Bad
const visible = true;
const submit = (e) => {};
const voted = checkVote();
```

### Functions and Methods
- Use arrow functions in React components and callbacks
- Write concise, single-purpose functions
- Add JSDoc comments for complex logic

```js
// ✅ Good
const calculateEntropy = (pwd) => {
  return pwd.length * Math.log2(charsetSize);
};

// ❌ Bad — too many responsibilities
const analyzePassword = (pwd) => {
  const entropy = pwd.length * Math.log2(charsetSize);
  const score = entropy * 1.2;
  const strength = classifyStrength(score);
  return { entropy, score, strength };
  // ^ Split into separate functions
};
```

### React Components
- Use functional components (not class components)
- Place `use client` directive at the top for client components
- Keep components small and focused
- Extract business logic into hooks or utilities

```jsx
// ✅ Good
'use client';

import { useState } from 'react';

export default function AppCard({ app }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div onClick={() => setIsExpanded(!isExpanded)}>
      {app.name}
    </div>
  );
}

// ❌ Bad — too much logic in component
export default function AppCard({ app }) {
  const [votes, setVotes] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  // ... (way too much state)
}
```

### Conditionals and Loops
- Use explicit comparisons and conditions
- Use early returns to reduce nesting
- Avoid ternaries for multi-line conditions

```js
// ✅ Good
if (!password) {
  return 'Password required';
}

const strength = score >= 80 ? 'Excellent' : score >= 65 ? 'Strong' : 'Weak';

// ❌ Bad
if (password !== '') {
  // nested logic
}

const strength = score >= 80 ? 'Excellent' : (score >= 65 ? 'Strong' : (score >= 35 ? 'Fair' : 'Weak'));
```

---

## CSS and Tailwind

- Use Tailwind CSS utility classes for styling
- Avoid inline styles
- For complex animations or selectors, use module CSS or `<style>` tags
- Use consistent spacing: multiples of `0.25rem` (4px baseline)
- Dark mode: Use `dark:` prefix for dark theme variants

```jsx
// ✅ Good
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-800 rounded-lg text-white">
  Click me
</button>

// ❌ Bad
<button style={{ padding: '10px 15px', backgroundColor: '#2563eb' }}>
  Click me
</button>
```

---

## File Organization

### Directory Structure
```
/
├── app/                 # Next.js App Router
│   ├── page.jsx         # Home page
│   ├── layout.jsx       # Root layout
│   ├── [...id]/         # Dynamic routes
│   ├── suggest/         # Sub-pages
│   └── sitemap.js       # SEO
├── components/          # Reusable React components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and helpers
├── styles/              # Global CSS
├── public/              # Static assets (synced at build)
├── scripts/             # Build and utility scripts
├── docs/                # Documentation
└── apps/                # App source files (synced to public/)
```

### File Naming
- Components: **PascalCase** (`Header.jsx`, `LayoutShell.jsx`)
- Hooks: **camelCase** (`useVotes.js`, `useTheme.js`)
- Utilities: **camelCase** (`siteConfig.js`, `supabase.js`)
- Styles: **globals.css** or **module.css**

---

## Git and Commits

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` – New feature
- `fix:` – Bug fix
- `docs:` – Documentation
- `style:` – Code style (formatting, missing semicolons)
- `refactor:` – Code refactoring without feature change
- `perf:` – Performance improvement
- `test:` – Adding tests
- `chore:` – Dependency updates, build config

**Examples:**
```
feat(entropy-lab): add generator checkboxes for charset options
fix(supabase): handle missing env vars during build on Vercel
docs(style-guide): add formatting standards
refactor(components): extract password validation logic
```

### Branch Naming
- Feature: `feat/description` (e.g., `feat/password-generator`)
- Bug fix: `fix/description` (e.g., `fix/hydration-mismatch`)
- Documentation: `docs/description` (e.g., `docs/update-readme`)

---

## Testing and Validation

### Before Committing
```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Build locally
npm run build

# Validate apps (if modified)
npm run validate:apps
```

---

## Performance

- Lazy load heavy components with `dynamic()` from Next.js
- Mark client-only components with `'use client'`
- Memoize expensive computations with `useMemo` or `useCallback`
- Use SSG/Static Generation where possible
- Optimize images and assets

```jsx
// ✅ Good
import dynamic from 'next/dynamic';
const HeavyComponent = dynamic(() => import('./Heavy'), { loading: () => <div>Loading...</div> });

// ❌ Bad
import HeavyComponent from './Heavy';
```

---

## Accessibility (a11y)

- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Add `aria-` attributes for dynamic content
- Ensure keyboard navigation works
- Use `alt` text for images
- Maintain color contrast ratios (4.5:1 for normal text)

```jsx
// ✅ Good
<button 
  onClick={handleVote} 
  aria-label="Vote for this app"
  disabled={hasVoted}
>
  ⭐ Vote
</button>

// ❌ Bad
<div onClick={handleVote} role="button">Vote</div>
```

---

## Documentation

- Add comments for **why**, not **what** (code is self-documenting)
- Use JSDoc for exported functions and complex logic
- Update README and relevant docs when adding features

```js
// ✅ Good
/**
 * Calculate password entropy using Shannon's formula
 * @param {string} password - The password to analyze
 * @returns {number} Entropy in bits
 */
const calculateEntropy = (password) => {
  const charset = new Set(password);
  return password.length * Math.log2(charset.size);
};

// ❌ Bad
// Get entropy
const entropy = pwd.length * Math.log2(charsetSize);
```

---

## Environment Variables

- Never commit `.env.local` or secrets
- Use `.env.example` to document required variables
- All public env vars must start with `NEXT_PUBLIC_`
- Document each variable in `.env.production.example`

---

## Summary Checklist

Before submitting a PR:
- [ ] Code passes ESLint (`npm run lint`)
- [ ] Code is formatted with Prettier (`npm run format`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Component names are PascalCase
- [ ] Functions use camelCase
- [ ] Event handlers start with `on`
- [ ] Booleans use `is/has/should` prefix
- [ ] No console.log left behind
- [ ] Commit message follows Conventional Commits
- [ ] Related tests pass (if applicable)
- [ ] Documentation updated (if user-facing change)

---

## Questions?

Refer to this guide, the README, or ask in a GitHub issue. We're happy to help clarify standards.
