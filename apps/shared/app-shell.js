(() => {
  const THEME_KEY = 'theme';
  const MAIN_SITE_URL_PLACEHOLDER = '__MAIN_SITE_URL__';
  const MAIN_SITE_NAME_PLACEHOLDER = '__MAIN_SITE_NAME__';
  const SOCIAL_X_URL_PLACEHOLDER = '__SOCIAL_X_URL__';
  const SOCIAL_FACEBOOK_URL_PLACEHOLDER = '__SOCIAL_FACEBOOK_URL__';
  const SOCIAL_INSTAGRAM_URL_PLACEHOLDER = '__SOCIAL_INSTAGRAM_URL__';
  const SHELL_CONFIG_PATH = '/apps/shared/shell-config.json';
  const DEFAULT_MAIN_SITE_URL = 'https://www.valleyofai.com';
  const DEFAULT_MAIN_SITE_NAME = 'Valley of AI';
  let shellConfig = null;

  function isResolvedValue(value, placeholder) {
    return !!value && value !== placeholder;
  }

  async function loadShellConfig() {
    try {
      const response = await fetch(SHELL_CONFIG_PATH, { cache: 'no-store' });
      if (!response.ok) return;
      const parsed = await response.json();
      shellConfig = parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      shellConfig = null;
    }
  }

  function resolveMainSiteUrl() {
    const metaUrl = document.querySelector('meta[name="voa-main-site-url"]')?.getAttribute('content')?.trim();
    if (isResolvedValue(metaUrl, MAIN_SITE_URL_PLACEHOLDER)) return metaUrl;
    const configUrl = shellConfig?.mainSiteUrl?.trim();
    if (isResolvedValue(configUrl, MAIN_SITE_URL_PLACEHOLDER)) return configUrl;
    return DEFAULT_MAIN_SITE_URL;
  }

  function resolveMainSiteName() {
    const metaName = document.querySelector('meta[name="voa-main-site-name"]')?.getAttribute('content')?.trim();
    if (isResolvedValue(metaName, MAIN_SITE_NAME_PLACEHOLDER)) return metaName;
    const configName = shellConfig?.mainSiteName?.trim();
    if (isResolvedValue(configName, MAIN_SITE_NAME_PLACEHOLDER)) return configName;
    return DEFAULT_MAIN_SITE_NAME;
  }

  function resolveMetaUrl(name, placeholder) {
    const value = document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim();
    if (isResolvedValue(value, placeholder)) return value;
    return '';
  }

  function resolveConfigUrl(key, placeholder) {
    const value = shellConfig?.[key]?.trim();
    if (isResolvedValue(value, placeholder)) return value;
    return '';
  }

  function resolveSocialLinks() {
    return [
      {
        key: 'x',
        href: resolveMetaUrl('voa-social-x-url', SOCIAL_X_URL_PLACEHOLDER) || resolveConfigUrl('socialXUrl', SOCIAL_X_URL_PLACEHOLDER),
        ariaLabel: 'X profile',
      },
      {
        key: 'facebook',
        href: resolveMetaUrl('voa-social-facebook-url', SOCIAL_FACEBOOK_URL_PLACEHOLDER) || resolveConfigUrl('socialFacebookUrl', SOCIAL_FACEBOOK_URL_PLACEHOLDER),
        ariaLabel: 'Facebook profile',
      },
      {
        key: 'instagram',
        href: resolveMetaUrl('voa-social-instagram-url', SOCIAL_INSTAGRAM_URL_PLACEHOLDER) || resolveConfigUrl('socialInstagramUrl', SOCIAL_INSTAGRAM_URL_PLACEHOLDER),
        ariaLabel: 'Instagram profile',
      },
    ].filter((item) => !!item.href);
  }

  function socialIconSvg(key) {
    if (key === 'x') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2H21l-6.56 7.5L22.16 22h-6.04l-4.73-6.18L5.98 22H3.22l7.02-8.02L1.84 2H8l4.27 5.58L18.244 2zM17.18 20h1.53L7.17 3.9H5.53L17.18 20z"/></svg>';
    }
    if (key === 'facebook') {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 22v-8h2.7l.5-3h-3.2V9.1c0-.9.3-1.6 1.7-1.6H17V4.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.3V11H8v3h2.4v8h3.1z"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5A3.95 3.95 0 0 0 7.75 20.2h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5zm8.95 1.35a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z"/></svg>';
  }

  function getAppName() {
    const explicitName = document.querySelector('meta[name="application-name"]')?.getAttribute('content')?.trim();
    if (explicitName) return explicitName;

    const firstHeading = document.querySelector('h1, .title, [data-app-title]');
    const headingText = firstHeading?.textContent?.trim();
    if (headingText) return headingText.replace(/^\s*[\u2190-\u27A1]+\s*/g, '').trim();

    const titleText = (document.title || 'Valley of AI App').trim();
    return titleText.replace(/\s*[|-]\s*Valley of AI.*$/i, '').trim();
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
    const current = document.documentElement.getAttribute('data-theme') || localStorage.getItem(THEME_KEY) || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  function ensureThemeInitialized() {
    const preferred = localStorage.getItem(THEME_KEY) || document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(preferred);
  }

  function hideLegacyBackLinks() {
    const links = document.querySelectorAll('a[href]');
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      const text = (link.textContent || '').toLowerCase();
      const inShellFooter = !!link.closest('.voa-shell-footer');
      if (inShellFooter) continue;
      if (!/valleyofai\.com/.test(href)) continue;
      if (!/back to valley|valley of ai/.test(text)) continue;

      const wrapper = link.closest('footer, .footer, .back, .home-link, .home-link-wrapper') || link;
      wrapper.classList.add('voa-hide-legacy-link');
    }
  }

  function injectShellStyles() {
    if (document.getElementById('voa-shell-style')) return;
    const style = document.createElement('style');
    style.id = 'voa-shell-style';
    style.textContent = `
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
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-height: 56px;
        padding: 10px 16px;
        background: color-mix(in srgb, var(--surface, #ffffff) 92%, transparent);
        border-bottom: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 28%, transparent);
        backdrop-filter: blur(8px);
      }

      .voa-shell-app-name {
        font: 700 0.98rem/1.2 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        color: var(--text, var(--text-primary, #f8fafc));
        letter-spacing: 0.01em;
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
    `;
    document.head.appendChild(style);
  }

  function injectShell() {
    if (document.getElementById('voa-shell-header')) return;

    document.body.classList.add('voa-shell-enabled');

    const header = document.createElement('header');
    header.id = 'voa-shell-header';
    header.className = 'voa-shell-header';

    const appName = document.createElement('div');
    appName.className = 'voa-shell-app-name';
    appName.textContent = getAppName();

    const toggle = document.createElement('button');
    toggle.id = 'voa-theme-toggle';
    toggle.className = 'theme-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Toggle theme');
    toggle.addEventListener('click', toggleTheme);

    header.appendChild(appName);
    header.appendChild(toggle);

    const footer = document.createElement('footer');
    footer.className = 'voa-shell-footer';

    const footerInner = document.createElement('div');
    footerInner.className = 'voa-shell-footer-inner';

    const footerLink = document.createElement('a');
    footerLink.className = 'voa-shell-footer-link';
    footerLink.href = resolveMainSiteUrl();
    footerLink.textContent = `Back to ${resolveMainSiteName()}`;
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

    footer.appendChild(footerInner);

    document.body.prepend(header);
    document.body.appendChild(footer);

    hideLegacyBackLinks();
    ensureThemeInitialized();
  }

  window.toggleTheme = toggleTheme;

  async function bootstrapShell() {
    await loadShellConfig();
    injectShellStyles();
    injectShell();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      void bootstrapShell();
    });
  } else {
    void bootstrapShell();
  }
})();
