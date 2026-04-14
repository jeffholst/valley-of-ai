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

  const agentName = app.generation?.agentName ? ` by ${app.generation.agentName}` : '';
  const modelName = app.generation?.llmModel ? ` using ${app.generation.llmModel}` : '';
  const baseDescription = app.shortDescription || `Explore ${app.name} on ${siteName}.`;
  const rawDescription = `An AI-generated web app${agentName}${modelName}. ${baseDescription}`;
  const description =
    rawDescription.length > 160 ? `${rawDescription.slice(0, 159)}\u2026` : rawDescription;
  const pageUrl = new URL(`/showcase/${id}`, siteUrl).toString();
  const imageUrl = app.thumbnailUrl ? new URL(app.thumbnailUrl, siteUrl).toString() : null;
  const keywords = [
    app.name,
    'AI-generated',
    'AI web app',
    app.category,
    ...(app.tags || []),
  ].filter(Boolean);

  return {
    title: `${app.name} - AI-generated ${app.category ? `${app.category.toLowerCase()} app` : 'web app'} | ${siteName}`,
    description,
    keywords,
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

  const pageUrl = new URL(`/showcase/${id}`, siteUrl).toString();
  const imageUrl = app.thumbnailUrl ? new URL(app.thumbnailUrl, siteUrl).toString() : null;
  const description = app.shortDescription || `Explore ${app.name} on ${siteName}.`;
  const isGame = app.category === 'Games';
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': isGame ? 'VideoGame' : 'WebApplication',
    name: app.name,
    description,
    applicationCategory: app.category || 'WebApplication',
    ...(isGame ? { genre: app.tags?.length ? app.tags[0] : undefined } : {}),
    operatingSystem: 'Web',
    url: pageUrl,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(app.createdAt ? { datePublished: app.createdAt } : {}),
    ...(app.generation?.agentName
      ? { author: { '@type': 'Organization', name: app.generation.agentName } }
      : {}),
    creator: { '@type': 'Organization', name: siteName, url: siteUrl },
    publisher: { '@type': 'Organization', name: siteName, url: siteUrl },
  };
  const safeJsonLd = JSON.stringify(schemaData)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      <AppDetailClient app={app} id={id} />
    </>
  );
}
