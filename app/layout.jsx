import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import LayoutShell from '@/components/LayoutShell';
import { siteName, siteDescription } from '@/lib/siteConfig';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: siteName || 'AI Gallery',
  description: siteDescription || 'A gallery of apps built by AI agents.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.className} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200`}
      >
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
