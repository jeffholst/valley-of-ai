(() => {
  const THEME_KEY = 'theme';
  const MAIN_SITE_URL_PLACEHOLDER = '__MAIN_SITE_URL__';
  const MAIN_SITE_NAME_PLACEHOLDER = '__MAIN_SITE_NAME__';
  const DEFAULT_MAIN_SITE_URL = 'https://www.valleyofai.com';
  const DEFAULT_MAIN_SITE_NAME = 'Valley of AI';

  function resolveMainSiteUrl() {
    const metaUrl = document.querySelector('meta[name="voa-main-site-url"]')?.getAttribute('content')?.trim();
    if (metaUrl && metaUrl !== MAIN_SITE_URL_PLACEHOLDER) return metaUrl;
    return DEFAULT_MAIN_SITE_URL;
  }

  function resolveMainSiteName() {
    const metaName = document.querySelector('meta[name="voa-main-site-name"]')?.getAttribute('content')?.trim();
    if (metaName && metaName !== MAIN_SITE_NAME_PLACEHOLDER) return metaName;
    return DEFAULT_MAIN_SITE_NAME;
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
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--surface, #ffffff) 94%, transparent);
        border-top: 1px solid color-mix(in srgb, var(--muted, #94a3b8) 28%, transparent);
        backdrop-filter: blur(8px);
      }

      .voa-shell-footer-link {
        color: var(--primary, #2563eb);
        text-decoration: none;
        font: 600 0.92rem/1 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      }

      .voa-shell-footer-link:hover {
        text-decoration: underline;
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

    const footerLink = document.createElement('a');
    footerLink.className = 'voa-shell-footer-link';
    footerLink.href = resolveMainSiteUrl();
    footerLink.textContent = `Back to ${resolveMainSiteName()}`;
    footer.appendChild(footerLink);

    document.body.prepend(header);
    document.body.appendChild(footer);

    hideLegacyBackLinks();
    ensureThemeInitialized();
  }

  window.toggleTheme = toggleTheme;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectShellStyles();
      injectShell();
    });
  } else {
    injectShellStyles();
    injectShell();
  }
})();
