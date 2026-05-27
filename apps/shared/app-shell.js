(() => {
  const THEME_KEY = 'theme';
  const MAIN_SITE_URL_PLACEHOLDER = '__MAIN_SITE_URL__';
  const MAIN_SITE_NAME_PLACEHOLDER = '__MAIN_SITE_NAME__';
  const GITHUB_URL_PLACEHOLDER = '__GITHUB_URL__';
  const SOCIAL_X_URL_PLACEHOLDER = '__SOCIAL_X_URL__';
  const SOCIAL_FACEBOOK_URL_PLACEHOLDER = '__SOCIAL_FACEBOOK_URL__';
  const SOCIAL_INSTAGRAM_URL_PLACEHOLDER = '__SOCIAL_INSTAGRAM_URL__';
  const SOCIAL_DISCORD_URL_PLACEHOLDER = '__SOCIAL_DISCORD_URL__';
  const TURNSTILE_SITE_KEY_PLACEHOLDER = '__TURNSTILE_SITE_KEY__';
  let currentShareUrl = null;
  const SHELL_CONFIG_PATH = '/apps/shared/shell-config.json';
  const DEFAULT_MAIN_SITE_URL = '';
  const DEFAULT_MAIN_SITE_NAME = '';
  let shellConfig = null;
  let leaderboardSupportPromise = null;

  function isResolvedValue(value, placeholder) {
    return !!value && value !== placeholder;
  }

  async function loadShellConfig() {
    try {
      const response = await fetch(SHELL_CONFIG_PATH, { cache: 'no-store' });
      if (!response.ok) {
        return;
      }
      const parsed = await response.json();
      shellConfig = parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      shellConfig = null;
    }
  }

  function resolveMainSiteUrl() {
    const metaUrl = document
      .querySelector('meta[name="voa-main-site-url"]')
      ?.getAttribute('content')
      ?.trim();
    if (isResolvedValue(metaUrl, MAIN_SITE_URL_PLACEHOLDER)) {
      return metaUrl;
    }
    const configUrl = shellConfig?.mainSiteUrl?.trim();
    if (isResolvedValue(configUrl, MAIN_SITE_URL_PLACEHOLDER)) {
      return configUrl;
    }
    return DEFAULT_MAIN_SITE_URL;
  }

  function resolveMainSiteName() {
    const metaName = document
      .querySelector('meta[name="voa-main-site-name"]')
      ?.getAttribute('content')
      ?.trim();
    if (isResolvedValue(metaName, MAIN_SITE_NAME_PLACEHOLDER)) {
      return metaName;
    }
    const configName = shellConfig?.mainSiteName?.trim();
    if (isResolvedValue(configName, MAIN_SITE_NAME_PLACEHOLDER)) {
      return configName;
    }
    return DEFAULT_MAIN_SITE_NAME;
  }

  function resolveMetaUrl(name, placeholder) {
    const value = document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim();
    if (isResolvedValue(value, placeholder)) {
      return value;
    }
    return '';
  }

  function resolveConfigUrl(key, placeholder) {
    const value = shellConfig?.[key]?.trim();
    if (isResolvedValue(value, placeholder)) {
      return value;
    }
    return '';
  }

  function resolveStoragePrefix() {
    const value = shellConfig?.storagePrefix?.trim();
    if (value && value !== '__STORAGE_PREFIX__') {
      return value;
    }
    return 'app';
  }

  function resolveAppId() {
    return (
      document.querySelector('meta[name="voa-app-id"]')?.getAttribute('content')?.trim() || null
    );
  }

  function resolveTurnstileSiteKey() {
    return resolveConfigUrl('turnstileSiteKey', TURNSTILE_SITE_KEY_PLACEHOLDER);
  }

  async function pageSupportsLeaderboard() {
    try {
      const response = await fetch('./meta.json', { cache: 'force-cache' });
      if (response.ok) {
        const parsed = await response.json();
        return parsed.leaderboard === true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  function getLocalVoteRecord(appId) {
    try {
      const prefix = resolveStoragePrefix();
      const stored = localStorage.getItem(`${prefix}_votes_v2`);
      const records = stored ? JSON.parse(stored) : {};
      if (records[appId]) {
        return records[appId];
      }
      const legacy = localStorage.getItem(`${prefix}_voted_apps`);
      const legacyRecords = legacy ? JSON.parse(legacy) : {};
      if (legacyRecords[appId]) {
        return { type: 'up', ts: legacyRecords[appId] };
      }
      return null;
    } catch {
      return null;
    }
  }

  function saveLocalVoteRecord(appId, type) {
    try {
      const prefix = resolveStoragePrefix();
      const key = `${prefix}_votes_v2`;
      const stored = localStorage.getItem(key);
      const records = stored ? JSON.parse(stored) : {};
      records[appId] = { type, ts: Date.now() };
      localStorage.setItem(key, JSON.stringify(records));
    } catch {
      /* ignore */
    }
  }

  async function fetchVoteCounts(appId) {
    const res = await fetch(`/api/votes?appId=${encodeURIComponent(appId)}`);
    if (!res.ok) {
      return { up: 0, down: 0 };
    }
    const data = await res.json();
    return {
      up: data.filter((r) => r.vote_type === 'up').length,
      down: data.filter((r) => r.vote_type === 'down').length,
    };
  }

  async function submitVote(appId, type) {
    const res = await fetch('/api/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId, voteType: type }),
    });
    return res.ok || res.status === 201;
  }

  function resolveSocialLinks() {
    return [
      {
        key: 'github',
        href: resolveMetaUrl('voa-github-url', GITHUB_URL_PLACEHOLDER),
        ariaLabel: 'GitHub repository',
      },
      {
        key: 'x',
        href:
          resolveMetaUrl('voa-social-x-url', SOCIAL_X_URL_PLACEHOLDER) ||
          resolveConfigUrl('socialXUrl', SOCIAL_X_URL_PLACEHOLDER),
        ariaLabel: 'X profile',
      },
      {
        key: 'facebook',
        href:
          resolveMetaUrl('voa-social-facebook-url', SOCIAL_FACEBOOK_URL_PLACEHOLDER) ||
          resolveConfigUrl('socialFacebookUrl', SOCIAL_FACEBOOK_URL_PLACEHOLDER),
        ariaLabel: 'Facebook profile',
      },
      {
        key: 'instagram',
        href:
          resolveMetaUrl('voa-social-instagram-url', SOCIAL_INSTAGRAM_URL_PLACEHOLDER) ||
          resolveConfigUrl('socialInstagramUrl', SOCIAL_INSTAGRAM_URL_PLACEHOLDER),
        ariaLabel: 'Instagram profile',
      },
      {
        key: 'discord',
        href: resolveConfigUrl('socialDiscordUrl', SOCIAL_DISCORD_URL_PLACEHOLDER),
        ariaLabel: 'Discord server',
      },
    ].filter((item) => !!item.href);
  }

  function socialIconSvg(key) {
    if (key === 'github') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>';
    }
    if (key === 'x') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2H21l-6.56 7.5L22.16 22h-6.04l-4.73-6.18L5.98 22H3.22l7.02-8.02L1.84 2H8l4.27 5.58L18.244 2zM17.18 20h1.53L7.17 3.9H5.53L17.18 20z"/></svg>';
    }
    if (key === 'facebook') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-8h2.7l.5-3h-3.2V9.1c0-.9.3-1.6 1.7-1.6H17V4.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.3V11H8v3h2.4v8h3.1z"/></svg>';
    }
    if (key === 'discord') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5A3.95 3.95 0 0 0 7.75 20.2h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5zm8.95 1.35a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z"/></svg>';
  }

  function getAppName() {
    const explicitName = document
      .querySelector('meta[name="application-name"]')
      ?.getAttribute('content')
      ?.trim();
    if (explicitName) {
      return explicitName;
    }

    // Use <title> before h1 — h1 may be in-app content (e.g. a card topic) not the app name
    const titleText = (document.title || '').trim();
    const fromTitle = titleText.replace(/\s*[-|]\s*[^-|]*$/, '').trim();
    if (fromTitle) {
      return fromTitle;
    }

    const firstHeading = document.querySelector('h1, .title, [data-app-title]');
    const headingText = firstHeading?.textContent?.trim();
    if (headingText) {
      return headingText.replace(/^\s*[\u2190-\u27A1]+\s*/g, '').trim();
    }

    return resolveMainSiteName() || 'App';
  }

  function setToggleIcons(theme) {
    const icon = theme === 'dark' ? '☀️' : '🌙';
    const toggles = document.querySelectorAll('.theme-toggle');
    for (const toggle of toggles) {
      toggle.textContent = icon;
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    setToggleIcons(theme);
  }

  function toggleTheme() {
    const current =
      document.documentElement.getAttribute('data-theme') ||
      localStorage.getItem(THEME_KEY) ||
      'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  function ensureThemeInitialized() {
    const preferred =
      localStorage.getItem(THEME_KEY) ||
      document.documentElement.getAttribute('data-theme') ||
      'light';
    applyTheme(preferred);
  }

  function hideLegacyBackLinks() {
    const links = document.querySelectorAll('a[href]');
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      const text = (link.textContent || '').toLowerCase();
      const inShellFooter = !!link.closest('.voa-shell-footer');
      if (inShellFooter) {
        continue;
      }
      if (!/valleyofai\.com/.test(href)) {
        continue;
      }
      if (!/back to valley|valley of ai/.test(text)) {
        continue;
      }

      const wrapper =
        link.closest('footer, .footer, .back, .home-link, .home-link-wrapper') || link;
      wrapper.classList.add('voa-hide-legacy-link');
    }
  }

  function injectShellStyles() {
    if (document.getElementById('voa-shell-style')) {
      return;
    }
    const style = document.createElement('style');
    style.id = 'voa-shell-style';
    style.textContent = `
      :root {
        --bg: #0f172a;
        --text: #f9fafb;
        --surface: #1e293b;
        --muted: #94a3b8;
        --primary: #2563eb;
        --accent: #22d3ee;
      }
      [data-theme='light'] {
        --bg: #ffffff;
        --text: #1f2937;
        --surface: #f3f4f6;
        --muted: #9ca3af;
        --primary: #3b82f6;
        --accent: #06b6d4;
      }

      body.voa-shell-enabled {
        padding-top: 64px;
        padding-bottom: 56px;
        box-sizing: border-box;
      }

      .voa-shell-header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        align-items: center;
        min-height: 56px;
        padding: 10px 16px;
        background: color-mix(in srgb, var(--surface, #ffffff) 92%, transparent);
        border-bottom: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 28%, transparent);
        backdrop-filter: blur(8px);
        gap: 8px;
      }

      .voa-shell-home-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--muted, #94a3b8) 15%, transparent);
        color: var(--text, var(--text-primary, #f8fafc));
        border: none;
        cursor: pointer;
        font-size: 1.1rem;
        transition: background 150ms ease, transform 150ms ease;
        text-decoration: none;
      }

      .voa-shell-home-btn:hover {
        background: color-mix(in srgb, var(--muted, #94a3b8) 28%, transparent);
        transform: scale(1.08);
      }

      #voa-theme-toggle.theme-toggle {
        justify-self: end;
      }

      .voa-shell-app-name {
        font: 700 0.98rem/1.2 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        color: var(--text, var(--text-primary, #f8fafc));
        letter-spacing: 0.01em;
        display: flex;
        align-items: center;
        gap: 7px;
        min-width: 0;
        cursor: pointer;
        text-decoration: none;
        transition: opacity 150ms ease;
      }

      .voa-shell-app-name:hover {
        opacity: 0.8;
      }

      .voa-shell-ai-tag {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font: 600 0.72rem/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        letter-spacing: 0.03em;
        color: #0f172a;
        background: linear-gradient(120deg, #22d3ee, #a78bfa);
        border-radius: 999px;
        padding: 2px 8px 2px 5px;
        white-space: nowrap;
        flex-shrink: 0;
        text-decoration: none;
        cursor: pointer;
        transition: transform 150ms ease, box-shadow 150ms ease;
      }

      .voa-shell-ai-tag:hover {
        transform: scale(1.08);
        box-shadow: 0 4px 12px rgba(34, 211, 238, 0.3);
      }

      #voa-theme-toggle.theme-toggle {
        width: 40px;
        height: 40px;
        border-radius: 999px;
        border: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 28%, transparent);
        background: var(--surface, #ffffff);
        color: var(--text, var(--text-primary, #f8fafc));
        cursor: pointer;
        font-size: 1.05rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      #voa-theme-toggle.theme-toggle:hover {
        transform: scale(1.05);
      }

      .theme-toggle:not(#voa-theme-toggle) {
        display: none !important;
      }

      .voa-shell-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 9998;
        min-height: 46px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--surface, #ffffff) 94%, transparent);
        border-top: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 28%, transparent);
        backdrop-filter: blur(8px);
      }

      .voa-shell-footer-inner {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .voa-shell-footer-link {
        color: var(--primary, #2563eb);
        text-decoration: none;
        font: 600 0.92rem/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      }

      .voa-shell-footer-link:hover {
        text-decoration: underline;
      }

      .voa-shell-footer-sep {
        color: color-mix(in srgb, var(--muted, #94a3b8) 70%, transparent);
      }

      .voa-shell-social {
        color: var(--text, var(--text-primary, #f8fafc));
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
      }

      .voa-shell-social:hover {
        transform: scale(1.08);
      }

      .voa-shell-social svg {
        width: 100%;
        height: 100%;
      }

      .voa-hide-legacy-link {
        display: none !important;
      }

      .voa-vote-group {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .voa-vote-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font: 600 0.82rem/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 35%, transparent);
        background: color-mix(in srgb, var(--surface, #1e293b) 80%, transparent);
        color: var(--text, #f8fafc);
        cursor: pointer;
        transition: background 150ms ease, transform 150ms ease, color 150ms ease;
        white-space: nowrap;
      }

      .voa-vote-btn:hover:not(:disabled) {
        transform: scale(1.05);
      }

      .voa-vote-btn:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .voa-vote-btn.active-up {
        background: color-mix(in srgb, #22c55e 20%, transparent);
        border-color: #22c55e;
        color: #4ade80;
        opacity: 1;
      }

      .voa-vote-btn.active-down {
        background: color-mix(in srgb, #ef4444 20%, transparent);
        border-color: #ef4444;
        color: #f87171;
        opacity: 1;
      }

      .voa-improve-link {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font: 600 0.72rem/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        letter-spacing: 0.03em;
        color: #0f172a;
        background: linear-gradient(120deg, #fbbf24, #f97316);
        border-radius: 999px;
        padding: 2px 8px 2px 5px;
        white-space: nowrap;
        flex-shrink: 0;
        text-decoration: none;
        cursor: pointer;
        transition: transform 150ms ease, box-shadow 150ms ease;
      }

      .voa-improve-link:hover {
        transform: scale(1.08);
        box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
      }

      .voa-share-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font: 600 0.85rem/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        color: var(--text, #f8fafc);
        background: color-mix(in srgb, var(--surface, #1e293b) 80%, transparent);
        border: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 35%, transparent);
        border-radius: 999px;
        padding: 5px 12px;
        cursor: pointer;
        text-decoration: none;
        transition: background 150ms ease, transform 150ms ease;
      }

      .voa-share-btn:hover {
        background: color-mix(in srgb, var(--surface, #1e293b) 100%, transparent);
        transform: scale(1.04);
      }

      /* Drawer backdrop */
      .voa-share-backdrop {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(0,0,0,0.45);
        backdrop-filter: blur(3px);
        animation: voa-fade-in 200ms ease forwards;
      }

      .voa-share-backdrop.open {
        display: block;
      }

      @keyframes voa-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }

      /* Drawer panel */
      .voa-share-drawer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 10001;
        background: var(--surface, #1e293b);
        border-top: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 28%, transparent);
        border-radius: 20px 20px 0 0;
        padding: 0 20px 28px;
        transform: translateY(100%);
        transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
        max-width: 540px;
        margin: 0 auto;
      }

      .voa-share-drawer.open {
        transform: translateY(0);
      }

      .voa-share-handle {
        width: 40px;
        height: 4px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--muted, #94a3b8) 45%, transparent);
        margin: 10px auto 16px;
      }

      .voa-share-title {
        font: 700 1rem/1.3 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        color: var(--text, #f8fafc);
        margin: 0 0 16px;
        text-align: center;
      }

      .voa-share-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
        gap: 10px;
        margin-bottom: 14px;
      }

      .voa-share-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        text-decoration: none;
        cursor: pointer;
        background: none;
        border: none;
        padding: 10px 4px;
        border-radius: 14px;
        transition: background 150ms ease, transform 120ms ease;
        color: var(--text, #f8fafc);
        font: 600 0.72rem/1.2 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        text-align: center;
      }

      .voa-share-item:hover {
        background: color-mix(in srgb, var(--muted, #94a3b8) 15%, transparent);
        transform: translateY(-2px);
      }

      .voa-share-icon {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.35rem;
        flex-shrink: 0;
      }

      .voa-share-icon svg {
        width: 22px;
        height: 22px;
        fill: #fff;
      }

      .voa-share-copy-row {
        display: flex;
        gap: 8px;
        align-items: center;
        background: color-mix(in srgb, var(--bg, #0f172a) 60%, var(--surface, #1e293b));
        border: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 28%, transparent);
        border-radius: 12px;
        padding: 8px 12px;
        margin-top: 4px;
      }

      .voa-share-url {
        flex: 1;
        font: 0.8rem/1.3 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        color: color-mix(in srgb, var(--muted, #94a3b8) 90%, transparent);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        user-select: all;
      }

      .voa-copy-btn {
        flex-shrink: 0;
        font: 600 0.8rem/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        color: var(--accent, #22d3ee);
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 0;
        transition: opacity 150ms;
      }

      .voa-copy-btn:hover { opacity: 0.75; }

      @media (max-width: 479px) {
        .voa-shell-app-name-text {
          display: inline-block;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .voa-shell-home-btn {
          width: 32px;
          height: 32px;
          font-size: 0.95rem;
        }
        .voa-pill-text { display: none; }
        .voa-vote-count { display: none; }
        .voa-footer-site-name { display: none; }
      }

      /* Leaderboard modal */
      .voa-lb-backdrop {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 10002;
        background: rgba(0,0,0,0.55);
        backdrop-filter: blur(3px);
        align-items: center;
        justify-content: center;
      }

      .voa-lb-backdrop.open {
        display: flex;
        animation: voa-fade-in 200ms ease forwards;
      }

      .voa-lb-modal {
        position: relative;
        background: var(--surface, #1e293b);
        border: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 28%, transparent);
        border-radius: 20px;
        padding: 24px 20px 20px;
        width: 100%;
        max-width: 400px;
        margin: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        animation: voa-lb-slide-up 280ms cubic-bezier(0.32, 0.72, 0, 1) forwards;
      }

      @keyframes voa-lb-slide-up {
        from { opacity: 0; transform: translateY(20px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      .voa-lb-title {
        font: 700 1.05rem/1.3 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        color: var(--text, #f8fafc);
        text-align: center;
        margin: 0 0 18px;
      }

      .voa-lb-label {
        font: 600 0.88rem/1.4 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        color: var(--text, #f8fafc);
        margin: 0 0 8px;
        display: block;
      }

      .voa-lb-input {
        width: 100%;
        min-height: 44px;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 40%, transparent);
        background: color-mix(in srgb, var(--bg, #0f172a) 60%, var(--surface, #1e293b));
        color: var(--text, #f8fafc);
        font: 0.92rem/1.4 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        box-sizing: border-box;
        outline: none;
        transition: border-color 150ms;
      }

      .voa-lb-input:focus {
        border-color: var(--accent, #22d3ee);
      }

      .voa-lb-hint {
        color: var(--muted, #94a3b8);
        font: 0.78rem/1.3 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        margin: 5px 0 0;
        display: block;
      }

      .voa-lb-error {
        color: #f87171;
        font: 0.8rem/1.3 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        min-height: 1.2em;
        margin: 6px 0 0;
        display: block;
      }

      .voa-lb-turnstile {
        margin: 14px 0 0;
        display: flex;
        justify-content: center;
        min-height: 65px;
      }

      .voa-lb-btn-row {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }

      .voa-lb-submit-btn {
        flex: 1;
        min-height: 44px;
        border-radius: 10px;
        border: none;
        background: var(--primary, #2563eb);
        color: #fff;
        font: 700 0.92rem/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        cursor: pointer;
        transition: opacity 150ms, transform 150ms;
      }

      .voa-lb-submit-btn:hover:not(:disabled) {
        opacity: 0.88;
        transform: scale(1.02);
      }

      .voa-lb-submit-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .voa-lb-cancel-btn {
        min-height: 44px;
        padding: 0 16px;
        border-radius: 10px;
        border: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 40%, transparent);
        background: transparent;
        color: var(--text, #f8fafc);
        font: 600 0.88rem/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        cursor: pointer;
        transition: background 150ms;
      }

      .voa-lb-cancel-btn:hover {
        background: color-mix(in srgb, var(--muted, #94a3b8) 15%, transparent);
      }

      .voa-lb-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 4px;
        font: 0.88rem/1.4 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      }

      .voa-lb-table th {
        color: var(--muted, #94a3b8);
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 4px 8px;
        text-align: left;
        border-bottom: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 20%, transparent);
      }

      .voa-lb-table td {
        padding: 8px 8px;
        color: var(--text, #f8fafc);
        border-bottom: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 10%, transparent);
      }

      .voa-lb-table tr.voa-lb-me td {
        background: color-mix(in srgb, var(--accent, #22d3ee) 12%, transparent);
        font-weight: 600;
      }

      .voa-lb-empty {
        text-align: center;
        color: var(--muted, #94a3b8);
        font: 0.88rem/1.5 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        padding: 20px 0;
        margin: 0;
      }

      .voa-lb-close-btn {
        display: block;
        width: 100%;
        min-height: 44px;
        border-radius: 10px;
        border: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 40%, transparent);
        background: transparent;
        color: var(--text, #f8fafc);
        font: 600 0.92rem/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        cursor: pointer;
        margin-top: 16px;
        transition: background 150ms;
      }

      .voa-lb-close-btn:hover {
        background: color-mix(in srgb, var(--muted, #94a3b8) 15%, transparent);
      }

      #voa-lb-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 28%, transparent);
        background: var(--surface, #1e293b);
        color: var(--text, #f8fafc);
        cursor: pointer;
        font-size: 1rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: transform 150ms, background 150ms;
      }

      #voa-lb-btn:hover {
        transform: scale(1.08);
        background: color-mix(in srgb, var(--muted, #94a3b8) 28%, transparent);
      }
    `;
    document.head.appendChild(style);
  }

  let _voaShareText = null;
  let _voaShareUrl = null;
  let _leaderboardModalOpen = false;
  let _turnstileWidgetId = null;

  function injectShell() {
    if (document.getElementById('voa-shell-header')) {
      return;
    }

    document.body.classList.add('voa-shell-enabled');

    const header = document.createElement('header');
    header.id = 'voa-shell-header';
    header.className = 'voa-shell-header';

    const homeBtn = document.createElement('a');
    homeBtn.className = 'voa-shell-home-btn';
    const isLocalHome =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const homeBase = isLocalHome ? window.location.origin : resolveMainSiteUrl();
    homeBtn.href = homeBase;
    homeBtn.innerHTML = '🏠';
    homeBtn.setAttribute('aria-label', 'Back to home');

    const appName = document.createElement('a');
    appName.className = 'voa-shell-app-name';
    appName.href = homeBase;
    appName.setAttribute('aria-label', `Go to ${getAppName()} details`);
    const nameText = document.createElement('span');
    nameText.className = 'voa-shell-app-name-text';
    nameText.textContent = getAppName();
    appName.appendChild(nameText);
    const toggle = document.createElement('button');
    toggle.id = 'voa-theme-toggle';
    toggle.className = 'theme-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Toggle theme');
    toggle.addEventListener('click', toggleTheme);

    const voteGroup = document.createElement('div');
    voteGroup.id = 'voa-vote-group';
    voteGroup.className = 'voa-vote-group';

    const aiTag = document.createElement('a');
    aiTag.className = 'voa-shell-ai-tag';
    const appDetailId = resolveAppId();
    const isLocalLearn =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const learnBase = isLocalLearn ? window.location.origin : resolveMainSiteUrl();
    aiTag.href = appDetailId ? `${learnBase}/showcase/${appDetailId}#app-info` : learnBase;
    aiTag.innerHTML = '🧠 <span class="voa-pill-text">Learn</span>';
    aiTag.setAttribute('aria-label', 'View app details');
    voteGroup.appendChild(aiTag);

    header.appendChild(homeBtn);
    header.appendChild(appName);
    header.appendChild(voteGroup);
    header.appendChild(toggle);

    const footer = document.createElement('footer');
    footer.className = 'voa-shell-footer';

    const footerInner = document.createElement('div');
    footerInner.className = 'voa-shell-footer-inner';

    const footerLink = document.createElement('a');
    footerLink.className = 'voa-shell-footer-link';
    footerLink.href = resolveMainSiteUrl();
    footerLink.textContent = 'Back to 🏔️ ';
    const footerSiteNameSpan = document.createElement('span');
    footerSiteNameSpan.className = 'voa-footer-site-name';
    footerSiteNameSpan.textContent = resolveMainSiteName();
    footerLink.appendChild(footerSiteNameSpan);
    footerInner.appendChild(footerLink);

    const socialLinks = resolveSocialLinks();
    if (socialLinks.length > 0) {
      const sep = document.createElement('span');
      sep.className = 'voa-shell-footer-sep';
      sep.textContent = '|';
      footerInner.appendChild(sep);

      for (const item of socialLinks) {
        const socialLink = document.createElement('a');
        socialLink.className = 'voa-shell-social';
        socialLink.href = item.href;
        socialLink.target = '_blank';
        socialLink.rel = 'noopener';
        socialLink.setAttribute('aria-label', item.ariaLabel);
        socialLink.innerHTML = socialIconSvg(item.key);
        footerInner.appendChild(socialLink);
      }
    }

    const shareSep = document.createElement('span');
    shareSep.className = 'voa-shell-footer-sep';
    shareSep.textContent = '|';
    footerInner.appendChild(shareSep);

    const shareBtn = document.createElement('button');
    shareBtn.className = 'voa-share-btn';
    shareBtn.type = 'button';
    shareBtn.setAttribute('aria-label', 'Share this app');
    shareBtn.innerHTML =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share';
    shareBtn.addEventListener('click', openShareDrawer);
    footerInner.appendChild(shareBtn);

    footer.appendChild(footerInner);

    // Share drawer
    const backdrop = document.createElement('div');
    backdrop.className = 'voa-share-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.addEventListener('click', closeShareDrawer);

    const drawer = document.createElement('div');
    drawer.className = 'voa-share-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'Share this app');

    const handle = document.createElement('div');
    handle.className = 'voa-share-handle';

    const drawerTitle = document.createElement('p');
    drawerTitle.className = 'voa-share-title';
    drawerTitle.textContent = 'Share this app';

    const grid = document.createElement('div');
    grid.className = 'voa-share-grid';

    const platformAnchors = [];

    currentShareUrl = _voaShareUrl || window.location.href;
    const platforms = [
      {
        label: 'X / Twitter',
        color: '#000',
        svg: '<svg viewBox="0 0 24 24"><path d="M18.244 2H21l-6.56 7.5L22.16 22h-6.04l-4.73-6.18L5.98 22H3.22l7.02-8.02L1.84 2H8l4.27 5.58L18.244 2zM17.18 20h1.53L7.17 3.9H5.53L17.18 20z"/></svg>',
        hrefFn: (pUrl, sText) => `https://x.com/intent/tweet?url=${pUrl}&text=${sText}`,
      },
      {
        label: 'Facebook',
        color: '#1877f2',
        svg: '<svg viewBox="0 0 24 24"><path d="M13.5 22v-8h2.7l.5-3h-3.2V9.1c0-.9.3-1.6 1.7-1.6H17V4.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.3V11H8v3h2.4v8h3.1z"/></svg>',
        hrefFn: (pUrl, sText, sMsg) =>
          `https://www.facebook.com/sharer/sharer.php?u=${pUrl}&quote=${sMsg}`,
      },
      {
        label: 'Reddit',
        color: '#ff4500',
        svg: '<svg viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 6.63 5.37 12 12 12s12-5.37 12-12C24 5.37 18.63 0 12 0zm6.33 13.53c.05.22.07.45.07.68 0 3.47-4.04 6.28-9.02 6.28s-9.02-2.81-9.02-6.28c0-.23.02-.46.07-.68a1.76 1.76 0 0 1-.7-1.41 1.77 1.77 0 0 1 3.02-1.25 8.68 8.68 0 0 1 4.7-1.49l.8-3.76 2.74.58a1.26 1.26 0 1 0 1.27-1.2 1.27 1.27 0 0 0-1.2.87l-2.43-.52-.71 3.36a8.69 8.69 0 0 1 4.66 1.49 1.77 1.77 0 0 1 3.02 1.25 1.76 1.76 0 0 1-.27.88zM8.5 13a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 8.5 13zm7 0a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 15.5 13zm-1.15 3.38c-.57.57-1.49.85-2.35.85s-1.78-.28-2.35-.85a.37.37 0 0 0-.53.52c.73.73 1.82 1.08 2.88 1.08s2.15-.35 2.88-1.08a.37.37 0 1 0-.53-.52z"/></svg>',
        hrefFn: (pUrl, sText) => `https://reddit.com/submit?url=${pUrl}&title=${sText}`,
      },
      {
        label: 'LinkedIn',
        color: '#0a66c2',
        svg: '<svg viewBox="0 0 24 24"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.35-1.85 3.59 0 4.25 2.36 4.25 5.43v6.31zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.57V9h3.55v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.27V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
        hrefFn: (pUrl, sText) =>
          `https://www.linkedin.com/shareArticle?mini=true&url=${pUrl}&title=${sText}`,
      },
      {
        label: 'WhatsApp',
        color: '#25d366',
        svg: '<svg viewBox="0 0 24 24"><path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96s-.47-.15-.67.15-.77.96-.94 1.16-.35.22-.65.07a8.17 8.17 0 0 1-2.4-1.48 9.03 9.03 0 0 1-1.66-2.07c-.17-.3-.02-.46.13-.61s.3-.35.44-.52.2-.3.3-.5.05-.37-.02-.52-.67-1.6-.91-2.19c-.24-.58-.49-.5-.67-.51H7.85c-.2 0-.52.07-.79.37s-1.04 1.02-1.04 2.48 1.07 2.88 1.22 3.08 2.1 3.21 5.09 4.5c.71.31 1.27.49 1.7.63.72.23 1.37.2 1.89.12.57-.09 1.75-.72 2-1.41s.25-1.29.17-1.41-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.86 9.86 0 0 1-1.5-5.26c0-5.45 4.44-9.88 9.9-9.88a9.88 9.88 0 0 1 9.88 9.9c0 5.45-4.43 9.86-9.9 9.86zm8.41-18.26A11.82 11.82 0 0 0 12.04 0C5.37 0 0 5.37 0 12.04a11.99 11.99 0 0 0 1.61 6.04L0 24l6.09-1.59a12.05 12.05 0 0 0 5.94 1.52h.01C18.72 23.93 24 18.55 24 11.88a11.97 11.97 0 0 0-3.54-8.34z"/></svg>',
        hrefFn: (pUrl, sText, sMsg) => `https://api.whatsapp.com/send?text=${sMsg}`,
      },
      {
        label: 'Telegram',
        color: '#229ed9',
        svg: '<svg viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
        hrefFn: (pUrl, sText) => `https://t.me/share/url?url=${pUrl}&text=${sText}`,
      },
      {
        label: 'Pinterest',
        color: '#e60023',
        svg: '<svg viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.44 7.64 11.21-.1-.95-.2-2.41.04-3.45.22-.93 1.48-6.27 1.48-6.27s-.38-.76-.38-1.88c0-1.76 1.02-3.08 2.29-3.08 1.08 0 1.6.81 1.6 1.78 0 1.09-.7 2.71-1.05 4.21-.3 1.26.62 2.28 1.85 2.28 2.22 0 3.72-2.86 3.72-6.24 0-2.57-1.74-4.37-4.23-4.37-2.88 0-4.57 2.16-4.57 4.4 0 .87.33 1.8.75 2.31a.3.3 0 0 1 .07.29c-.08.32-.25 1.01-.28 1.15-.04.18-.14.22-.32.13-1.24-.58-2.02-2.4-2.02-3.87 0-3.13 2.28-6.02 6.57-6.02 3.45 0 6.13 2.46 6.13 5.74 0 3.42-2.16 6.17-5.15 6.17-1.01 0-1.95-.52-2.27-1.14l-.62 2.3c-.22.86-.82 1.94-1.23 2.6.93.29 1.91.44 2.92.44 6.63 0 12-5.37 12-12S18.63 0 12 0z"/></svg>',
        hrefFn: (pUrl, sText) =>
          `https://pinterest.com/pin/create/button/?url=${pUrl}&description=${sText}`,
      },
      {
        label: 'Email',
        color: '#6b7280',
        svg: '<svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/></svg>',
        hrefFn: (pUrl, sText, sMsg) => `mailto:?subject=${sText}&body=${sMsg}`,
      },
      {
        label: 'Instagram',
        color: '#e1306c',
        copyOpen: 'https://www.instagram.com/',
        svg: '<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>',
      },
      {
        label: 'TikTok',
        color: '#010101',
        copyOpen: 'https://www.tiktok.com/',
        svg: '<svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34l.03-8.56a8.17 8.17 0 0 0 4.79 1.53V4.84a4.85 4.85 0 0 1-1.05-.15z"/></svg>',
      },
    ];

    for (const p of platforms) {
      const item = document.createElement('a');
      item.className = 'voa-share-item';
      if (p.copyOpen) {
        item.href = p.copyOpen;
        item.target = '_blank';
        item.addEventListener('click', () => {
          navigator.clipboard.writeText(currentShareUrl || window.location.href).catch(() => {});
          item.style.opacity = '0.7';
          setTimeout(() => {
            item.style.opacity = '';
          }, 600);
          closeShareDrawer();
        });
      } else {
        platformAnchors.push({ anchor: item, hrefFn: p.hrefFn });
        item.target = p.label === 'Email' ? '_self' : '_blank';
        item.addEventListener('click', closeShareDrawer);
      }
      item.rel = 'noopener';
      item.setAttribute('aria-label', `Share on ${p.label}`);

      const icon = document.createElement('div');
      icon.className = 'voa-share-icon';
      icon.style.background = p.color;
      icon.innerHTML = p.svg;

      const label = document.createElement('span');
      label.textContent = p.label;
      if (p.copyOpen) {
        const hint = document.createElement('small');
        hint.textContent = 'copies link';
        hint.style.cssText =
          'display:block;font-size:9px;opacity:0.6;line-height:1;margin-top:2px;';
        label.appendChild(hint);
      }

      item.appendChild(icon);
      item.appendChild(label);
      grid.appendChild(item);
    }

    const copyRow = document.createElement('div');
    copyRow.className = 'voa-share-copy-row';

    const urlSpan = document.createElement('span');
    urlSpan.className = 'voa-share-url';
    urlSpan.textContent = window.location.href;

    const copyBtn = document.createElement('button');
    copyBtn.className = 'voa-copy-btn';
    copyBtn.type = 'button';
    copyBtn.textContent = 'Copy link';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard
        .writeText(_voaEffectiveShareUrl || window.location.href)
        .then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = 'Copy link';
          }, 2000);
        })
        .catch(() => {
          copyBtn.textContent = 'Copy link';
        });
    });

    copyRow.appendChild(urlSpan);
    copyRow.appendChild(copyBtn);

    drawer.appendChild(handle);
    drawer.appendChild(drawerTitle);
    drawer.appendChild(grid);
    drawer.appendChild(copyRow);

    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeShareDrawer();
      }
    });

    // Block all keystrokes from reaching the game while the share drawer is open.
    // The drawer is a direct child of body (sibling of the backdrop), so events from
    // focusable elements inside it (copy button, platform links) bubble through the
    // drawer — stopping propagation here prevents the game from seeing them.
    drawer.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeShareDrawer();
      }
      e.stopPropagation();
    });
    drawer.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });

    let _voaEffectiveShareUrl = null;
    let _voaEffectiveShareText = null;

    function openShareDrawer() {
      const url = _voaShareUrl || window.location.href;
      const text = _voaShareText || '👉 Checkout what AI built';

      _voaEffectiveShareUrl = url;
      _voaEffectiveShareText = text;
      // Keep currentShareUrl (used by Instagram/TikTok "copies link" handlers) in sync
      // with the URL that was actually passed to voaShare() for this opening.
      currentShareUrl = url;
      // Update the displayed URL in the copy row to reflect any custom URL from voaShare().
      urlSpan.textContent = url;

      _voaShareText = null;
      _voaShareUrl = null;

      const pUrl = encodeURIComponent(_voaEffectiveShareUrl);
      const sText = encodeURIComponent(_voaEffectiveShareText);
      const sMsg = encodeURIComponent(_voaEffectiveShareText + ': ' + _voaEffectiveShareUrl);
      for (const { anchor, hrefFn } of platformAnchors) {
        anchor.href = hrefFn(pUrl, sText, sMsg);
      }
      backdrop.classList.add('open');
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      copyBtn.textContent = 'Copy link';
    }

    function closeShareDrawer() {
      backdrop.classList.remove('open');
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      _voaEffectiveShareUrl = null;
      _voaEffectiveShareText = null;
    }

    window.voaShare = function voaShare(opts) {
      _voaShareText = opts && typeof opts.text === 'string' ? opts.text : null;
      _voaShareUrl = opts && typeof opts.url === 'string' ? opts.url : null;
      openShareDrawer();
    };

    // Leaderboard modal
    const lbBackdrop = document.createElement('div');
    lbBackdrop.className = 'voa-lb-backdrop';
    lbBackdrop.setAttribute('aria-hidden', 'true');

    const lbModal = document.createElement('div');
    lbModal.className = 'voa-lb-modal';
    lbModal.setAttribute('role', 'dialog');
    lbModal.setAttribute('aria-modal', 'true');
    lbModal.setAttribute('aria-label', 'Leaderboard');

    const lbTitle = document.createElement('p');
    lbTitle.className = 'voa-lb-title';
    lbModal.appendChild(lbTitle);

    const lbContentArea = document.createElement('div');
    lbModal.appendChild(lbContentArea);
    lbBackdrop.appendChild(lbModal);
    document.body.appendChild(lbBackdrop);

    lbBackdrop.addEventListener('click', (e) => {
      if (e.target === lbBackdrop) {
        closeLbModal();
      }
    });

    // Block all keystrokes from reaching the game while the leaderboard modal is open.
    // Using the backdrop (parent of lbModal) catches events from any focusable child —
    // not just the name input, but also the Submit/Cancel/Close buttons.
    lbBackdrop.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLbModal();
      }
      e.stopPropagation();
    });
    lbBackdrop.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && _leaderboardModalOpen) {
        closeLbModal();
      }
    });

    function closeLbModal() {
      if (_turnstileWidgetId !== null && window.turnstile) {
        window.turnstile.remove(_turnstileWidgetId);
        _turnstileWidgetId = null;
      }
      lbBackdrop.classList.remove('open');
      lbBackdrop.setAttribute('aria-hidden', 'true');
      _leaderboardModalOpen = false;
    }

    function openLbModal() {
      lbBackdrop.classList.add('open');
      lbBackdrop.setAttribute('aria-hidden', 'false');
      _leaderboardModalOpen = true;
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    async function fetchTopScores(appId) {
      const res = await fetch(`/api/scores?appId=${encodeURIComponent(appId)}`);
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      return data.scores || [];
    }

    async function submitScore(appId, playerName, score, turnstileToken) {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, playerName, score, turnstileToken }),
      });
      return res.json();
    }

    function renderScoreTable(scores, highlightName) {
      if (!scores || scores.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'voa-lb-empty';
        empty.textContent = 'No scores yet. Be the first!';
        return empty;
      }
      const table = document.createElement('table');
      table.className = 'voa-lb-table';
      const thead = document.createElement('thead');
      thead.innerHTML = '<tr><th>#</th><th>Player</th><th>Score</th></tr>';
      table.appendChild(thead);
      const tbody = document.createElement('tbody');
      for (const row of scores) {
        const tr = document.createElement('tr');
        if (highlightName && row.player_name === highlightName) {
          tr.className = 'voa-lb-me';
        }
        tr.innerHTML = `<td>${row.rank}</td><td>${escapeHtml(row.player_name)}</td><td>${row.score}</td>`;
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
      return table;
    }

    function appendLbCloseBtn() {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'voa-lb-close-btn';
      closeBtn.type = 'button';
      closeBtn.textContent = 'Close';
      closeBtn.addEventListener('click', closeLbModal);
      lbContentArea.appendChild(closeBtn);
    }

    async function openLeaderboardBoard(appId, highlightName) {
      lbTitle.textContent = `\uD83C\uDFC6 Top 10 \u2014 ${getAppName()}`;
      lbContentArea.innerHTML = '<p class="voa-lb-empty">Loading scores\u2026</p>';
      openLbModal();
      try {
        const scores = await fetchTopScores(appId);
        lbContentArea.innerHTML = '';
        lbContentArea.appendChild(renderScoreTable(scores, highlightName || null));
      } catch {
        lbContentArea.innerHTML = '<p class="voa-lb-empty">Failed to load scores.</p>';
      }
      appendLbCloseBtn();
    }

    function openLeaderboardSubmit(score, opts) {
      const appId = resolveAppId();
      if (!appId) {
        return;
      }
      const appName = getAppName();
      const label = opts && typeof opts.label === 'string' ? opts.label : 'points';
      const prefix = resolveStoragePrefix();
      const savedName = (() => {
        try {
          return localStorage.getItem(`${prefix}_player_name`) || '';
        } catch {
          return '';
        }
      })();
      const siteKey = resolveTurnstileSiteKey();
      const isLocal =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      lbTitle.textContent = '\uD83C\uDFC6 New High Score!';
      lbContentArea.innerHTML = '';

      const scoreDisplay = document.createElement('p');
      scoreDisplay.style.cssText =
        'text-align:center;font:700 1.5rem/1.2 system-ui;color:var(--accent,#22d3ee);margin:0 0 16px;';
      scoreDisplay.textContent = `${score} ${label}`;
      lbContentArea.appendChild(scoreDisplay);

      const nameLabel = document.createElement('label');
      nameLabel.className = 'voa-lb-label';
      nameLabel.setAttribute('for', 'voa-lb-name-input');
      nameLabel.textContent = 'Your name:';
      lbContentArea.appendChild(nameLabel);

      const nameInput = document.createElement('input');
      nameInput.className = 'voa-lb-input';
      nameInput.id = 'voa-lb-name-input';
      nameInput.type = 'text';
      nameInput.maxLength = 20;
      nameInput.autocomplete = 'nickname';
      nameInput.placeholder = 'e.g. Star Player, CoolCat99';
      nameInput.value = savedName;
      nameInput.addEventListener('keydown', (e) => e.stopPropagation());
      nameInput.addEventListener('keyup', (e) => e.stopPropagation());

      const nameHint = document.createElement('span');
      nameHint.className = 'voa-lb-hint';
      nameHint.textContent = 'Letters, numbers, spaces, hyphens \u2014 2 to 20 characters';
      lbContentArea.appendChild(nameInput);
      lbContentArea.appendChild(nameHint);

      const errorMsg = document.createElement('span');
      errorMsg.className = 'voa-lb-error';
      errorMsg.setAttribute('role', 'alert');
      lbContentArea.appendChild(errorMsg);

      openLbModal();

      let turnstileToken = null;
      if (siteKey && !isLocal) {
        const tsDiv = document.createElement('div');
        tsDiv.className = 'voa-lb-turnstile';
        tsDiv.id = 'voa-lb-turnstile-widget';
        lbContentArea.appendChild(tsDiv);

        if (!document.getElementById('voa-turnstile-script')) {
          const tsScript = document.createElement('script');
          tsScript.id = 'voa-turnstile-script';
          tsScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
          tsScript.async = true;
          tsScript.defer = true;
          document.head.appendChild(tsScript);
        }

        const TURNSTILE_RENDER_RETRY_DELAY_MS = 200;
        const TURNSTILE_RENDER_MAX_RETRIES = 25;
        let turnstileRenderRetries = 0;
        let turnstileLoadFailed = false;

        function tryRenderTurnstile() {
          const turnstileWidget = document.getElementById('voa-lb-turnstile-widget');
          if (!_leaderboardModalOpen || !turnstileWidget || !turnstileWidget.isConnected) {
            return;
          }

          if (window.turnstile) {
            _turnstileWidgetId = window.turnstile.render(turnstileWidget, {
              sitekey: siteKey,
              callback: (token) => {
                turnstileToken = token;
              },
              'expired-callback': () => {
                turnstileToken = null;
              },
              'error-callback': () => {
                turnstileToken = null;
              },
              theme: 'auto',
              size: 'normal',
              appearance: 'interaction-only',
            });
          } else {
            if (turnstileRenderRetries >= TURNSTILE_RENDER_MAX_RETRIES) {
              turnstileLoadFailed = true;
              return;
            }
            turnstileRenderRetries += 1;
            setTimeout(tryRenderTurnstile, TURNSTILE_RENDER_RETRY_DELAY_MS);
          }
        }
        tryRenderTurnstile();
      }

      const btnRow = document.createElement('div');
      btnRow.className = 'voa-lb-btn-row';

      const submitBtn = document.createElement('button');
      submitBtn.className = 'voa-lb-submit-btn';
      submitBtn.type = 'button';
      submitBtn.textContent = 'Submit Score';

      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'voa-lb-cancel-btn';
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Skip';
      cancelBtn.addEventListener('click', closeLbModal);

      btnRow.appendChild(submitBtn);
      btnRow.appendChild(cancelBtn);
      lbContentArea.appendChild(btnRow);

      nameInput.focus();

      submitBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        if (name.length < 2 || name.length > 20) {
          errorMsg.textContent = 'Name must be 2\u201320 characters.';
          return;
        }
        if (!/^[a-zA-Z0-9 _\-]+$/.test(name)) {
          errorMsg.textContent = 'Only letters, numbers, spaces, - and _ are allowed.';
          return;
        }
        if (siteKey && !isLocal && !turnstileToken && !turnstileLoadFailed) {
          errorMsg.textContent = 'Please complete the bot check first.';
          return;
        }
        errorMsg.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting\u2026';
        try {
          const result = await submitScore(appId, name, score, turnstileToken || '');
          if (result.scores) {
            try {
              localStorage.setItem(`${prefix}_player_name`, name);
            } catch {
              /* ignore */
            }
            lbTitle.textContent = `\uD83C\uDFC6 Top 10 \u2014 ${appName}`;
            lbContentArea.innerHTML = '';
            lbContentArea.appendChild(renderScoreTable(result.scores, name));
            appendLbCloseBtn();
          } else {
            errorMsg.textContent = result.error || 'Failed to submit score. Please try again.';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Score';
          }
        } catch {
          errorMsg.textContent = 'Network error. Please try again.';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Score';
        }
      });
    }

    window.voaLeaderboard = {
      submit: function (score, opts) {
        openLeaderboardSubmit(score, opts || {});
      },
      show: function () {
        const appId = resolveAppId();
        if (appId) {
          void openLeaderboardBoard(appId, null);
        }
      },
    };

    document.body.prepend(header);
    document.body.appendChild(footer);

    hideLegacyBackLinks();
    ensureThemeInitialized();
  }

  window.toggleTheme = toggleTheme;

  async function bootstrapVoting() {
    const appId = resolveAppId();
    const container = document.getElementById('voa-vote-group');
    if (!appId || !container) {
      return;
    }

    const improveLink = document.createElement('a');
    improveLink.className = 'voa-improve-link';
    const isLocal =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const mainSiteBase = isLocal ? window.location.origin : resolveMainSiteUrl();
    improveLink.href = `${mainSiteBase}/improve?app=${encodeURIComponent(appId)}&name=${encodeURIComponent(getAppName())}`;
    improveLink.innerHTML = '💡 <span class="voa-pill-text">Improve</span>';
    improveLink.title = 'Suggest an improvement for this app';
    container.appendChild(improveLink);

    const leaderboardSupported =
      leaderboardSupportPromise || (leaderboardSupportPromise = pageSupportsLeaderboard());
    if (await leaderboardSupported) {
      const lbHeaderBtn = document.createElement('button');
      lbHeaderBtn.id = 'voa-lb-btn';
      lbHeaderBtn.type = 'button';
      lbHeaderBtn.setAttribute('aria-label', 'Leaderboard');
      lbHeaderBtn.textContent = '🏆';
      lbHeaderBtn.addEventListener('click', () => {
        if (window.voaLeaderboard) {
          window.voaLeaderboard.show();
        }
      });
      container.appendChild(lbHeaderBtn);
    }

    const myVoteRecord = getLocalVoteRecord(appId);
    const myVote = myVoteRecord?.type ?? null;
    const voted = !!myVote;

    // Fetch initial counts
    let counts = { up: 0, down: 0 };
    try {
      counts = await fetchVoteCounts(appId);
    } catch {
      /* ignore */
    }

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'voa-vote-btn' + (myVote === 'up' ? ' active-up' : '');
    upBtn.setAttribute('aria-label', 'Like this app');
    upBtn.disabled = voted;
    upBtn.appendChild(document.createTextNode('👍 '));
    const upCountSpan = document.createElement('span');
    upCountSpan.className = 'voa-vote-count';
    upBtn.appendChild(upCountSpan);

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'voa-vote-btn' + (myVote === 'down' ? ' active-down' : '');
    downBtn.setAttribute('aria-label', 'Dislike this app');
    downBtn.disabled = voted;
    downBtn.appendChild(document.createTextNode('👎 '));
    const downCountSpan = document.createElement('span');
    downCountSpan.className = 'voa-vote-count';
    downBtn.appendChild(downCountSpan);

    function renderCounts(up, down) {
      upCountSpan.textContent = up;
      downCountSpan.textContent = down;
    }

    renderCounts(counts.up, counts.down);

    async function handleVote(type) {
      upBtn.disabled = true;
      downBtn.disabled = true;
      // Optimistic update
      if (type === 'up') {
        counts.up += 1;
      } else {
        counts.down += 1;
      }
      renderCounts(counts.up, counts.down);
      if (type === 'up') {
        upBtn.classList.add('active-up');
      } else {
        downBtn.classList.add('active-down');
      }
      try {
        const ok = await submitVote(appId, type);
        if (ok) {
          saveLocalVoteRecord(appId, type);
        } else {
          // Revert
          if (type === 'up') {
            counts.up -= 1;
          } else {
            counts.down -= 1;
          }
          renderCounts(counts.up, counts.down);
          if (type === 'up') {
            upBtn.classList.remove('active-up');
          } else {
            downBtn.classList.remove('active-down');
          }
          upBtn.disabled = false;
          downBtn.disabled = false;
        }
      } catch {
        // Revert
        if (type === 'up') {
          counts.up -= 1;
        } else {
          counts.down -= 1;
        }
        renderCounts(counts.up, counts.down);
        if (type === 'up') {
          upBtn.classList.remove('active-up');
        } else {
          downBtn.classList.remove('active-down');
        }
        upBtn.disabled = false;
        downBtn.disabled = false;
      }
    }

    upBtn.addEventListener('click', () => handleVote('up'));
    downBtn.addEventListener('click', () => handleVote('down'));

    container.appendChild(upBtn);
    container.appendChild(downBtn);
  }

  async function bootstrapShell() {
    await loadShellConfig();
    injectShellStyles();
    injectShell();
    void bootstrapVoting();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      void bootstrapShell();
    });
  } else {
    void bootstrapShell();
  }
})();
