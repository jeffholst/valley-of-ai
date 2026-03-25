const BASE_URL = process.env.NEXT_PUBLIC_MAIN_SITE_URL || '';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
