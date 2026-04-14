import { notFound } from 'next/navigation';
import { siteName, siteUrl } from '@/lib/siteConfig';
import appsData from '@/data/apps.json';
import AppDetailClient from './AppDetailClient';

export const dynamic = 'force-static';

function resolveAppId(params) {
  const idSegments = params?.id;
  if (Array.isArray(idSegments)) {
    return idSegments.join('/');
  }
  return idSegments || '';
}

export function generateStaticParams() {
  return appsData.map((app) => ({ id: app.id.split('/') }));
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const id = resolveAppId(resolvedParams);
  const app = appsData.find((entry) => entry.id === id);

  if (!app) {
    return {
      title: `App not found - ${siteName}`,
      description: `This app could not be found on ${siteName}.`,
    };
  }

  const description = app.shortDescription || `Explore ${app.name} on ${siteName}.`;
  const pageUrl = new URL(`/showcase/${id}`, siteUrl).toString();
  const imageUrl = app.thumbnailUrl ? new URL(app.thumbnailUrl, siteUrl).toString() : null;

  return {
    title: `${app.name} - ${siteName}`,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: app.name,
      description,
      url: pageUrl,
      type: 'article',
      ...(imageUrl
        ? {
            images: [
              {
                url: imageUrl,
                width: 800,
                height: 450,
                alt: app.name,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title: app.name,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}

export default async function AppDetailPage({ params }) {
  const resolvedParams = await params;
  const id = resolveAppId(resolvedParams);
  const app = appsData.find((entry) => entry.id === id);

  if (!app) {
    notFound();
  }

  return <AppDetailClient app={app} id={id} />;
}
