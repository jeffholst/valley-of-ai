'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { siteName, siteEmoji } from '@/lib/siteConfig';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 transition-colors duration-200">
      <div ref={menuRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">{siteEmoji}</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{siteName}</span>
          </Link>

          <div className="hidden sm:flex items-center gap-6">
            <nav className="flex items-center gap-6" aria-label="Primary">
              <Link
                href="/"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-200"
              >
                Home
              </Link>
              <Link
                href="/versus"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-200"
              >
                Versus
              </Link>
              <Link
                href="/suggest"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-200"
              >
                Suggest
              </Link>
              <Link
                href="/leaderboard"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-200"
              >
                Leaderboard
              </Link>
              {process.env.NODE_ENV === 'development' && (
                <Link
                  href="/logs"
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-200"
                >
                  Logs
                </Link>
              )}
            </nav>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {isMenuOpen ? '✕' : '☰'}
              </span>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <nav id="mobile-navigation" aria-label="Mobile" className="sm:hidden pb-4">
            <Link
              href="/"
              onClick={closeMenu}
              className="block rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="/versus"
              onClick={closeMenu}
              className="block rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors duration-200"
            >
              Versus
            </Link>
            <Link
              href="/suggest"
              onClick={closeMenu}
              className="block rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors duration-200"
            >
              Suggest
            </Link>
            <Link
              href="/leaderboard"
              onClick={closeMenu}
              className="block rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors duration-200"
            >
              Leaderboard
            </Link>
            {process.env.NODE_ENV === 'development' && (
              <Link
                href="/logs"
                onClick={closeMenu}
                className="block rounded-lg px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors duration-200"
              >
                Logs
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
