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
  const description = `An AI-generated arcade game and web-based Breakout clone${agentName}${modelName}. ${baseDescription}`;
  const pageUrl = new URL(`/showcase/${id}`, siteUrl).toString();
  const imageUrl = app.thumbnailUrl ? new URL(app.thumbnailUrl, siteUrl).toString() : null;
  const keywords = [
    app.name,
    'AI-generated arcade game',
    'web-based Breakout clone',
    'browser game',
    app.category,
    ...(app.tags || []),
  ].filter(Boolean);

  return {
    title: `${app.name} - AI-generated arcade game | ${siteName}`,
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
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: app.name,
    description,
    applicationCategory: 'Game',
    genre: app.category,
    operatingSystem: 'Web',
    url: pageUrl,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(app.createdAt ? { datePublished: app.createdAt } : {}),
    ...(app.generation?.agentName
      ? { author: { '@type': 'Person', name: app.generation.agentName } }
      : {}),
    creator: { '@type': 'Organization', name: siteName, url: siteUrl },
    publisher: { '@type': 'Organization', name: siteName, url: siteUrl },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <AppDetailClient app={app} id={id} />
    </>
  );
}
