'use client'

import Header from './Header'
import { siteName, socialXUrl, socialFacebookUrl, socialInstagramUrl } from '@/lib/siteConfig'

const socialLinks = [
  {
    key: 'x',
    href: socialXUrl,
    ariaLabel: 'X profile',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.244 2H21l-6.56 7.5L22.16 22h-6.04l-4.73-6.18L5.98 22H3.22l7.02-8.02L1.84 2H8l4.27 5.58L18.244 2zM17.18 20h1.53L7.17 3.9H5.53L17.18 20z" />
      </svg>
    ),
  },
  {
    key: 'facebook',
    href: socialFacebookUrl,
    ariaLabel: 'Facebook profile',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 22v-8h2.7l.5-3h-3.2V9.1c0-.9.3-1.6 1.7-1.6H17V4.8c-.3 0-1.3-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4.3V11H8v3h2.4v8h3.1z" />
      </svg>
    ),
  },
  {
    key: 'instagram',
    href: socialInstagramUrl,
    ariaLabel: 'Instagram profile',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5A3.95 3.95 0 0 0 7.75 20.2h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5zm8.95 1.35a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z" />
      </svg>
    ),
  },
].filter((link) => !!link.href)

const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0'
const deployVersion = process.env.NEXT_PUBLIC_DEPLOY_VERSION || appVersion

export default function LayoutShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <footer className="relative z-20 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>✨ An experiment in AI, powered by curiosity and <span className="heart-pulse">❤️</span> from <span className="sparkle-text">Jeff Holst</span></span>
          <div className="flex items-center gap-4">
            <span>🏔️ {siteName} © 2026</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <a 
              href="https://github.com/jeffholst/valley-of-ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-900 dark:hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
            {socialLinks.length > 0 && <span className="text-gray-300 dark:text-gray-600">•</span>}
            {socialLinks.map((link) => (
              <a
                key={link.key}
                href={link.href}
                target="_blank"
                rel="noopener"
                aria-label={link.ariaLabel}
                className="hover:text-gray-900 dark:hover:text-white transition-colors inline-flex items-center"
              >
                {link.icon}
              </a>
            ))}
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span className="text-xs" title={`App ${appVersion}`}>
              v{deployVersion}
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
