import appsData from '@/data/apps.json';

const BASE_URL = process.env.NEXT_PUBLIC_MAIN_SITE_URL || '';

export default function sitemap() {
  const appEntries = appsData.map((app) => ({
    url: `${BASE_URL}/apps/${app.id}`,
    lastModified: app.createdAt ? new Date(app.createdAt) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/suggest`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...appEntries,
  ];
}
