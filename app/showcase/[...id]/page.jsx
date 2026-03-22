'use client';

import Link from 'next/link';
import { useVotes } from '@/hooks/useVotes';
import VoteButtons from '@/components/VoteButtons';
import { notFound } from 'next/navigation';
import { use } from 'react';
import AppLog from '@/components/AppLog';
import { githubUrl } from '@/lib/siteConfig';

import appsData from '@/data/apps.json';

export default function AppDetailPage({ params }) {
  const { id: idSegments } = use(params);
  const id = idSegments.join('/');

  const app = appsData.find((a) => a.id === id);

  if (!app) {
    notFound();
  }

  return <AppDetailContent app={app} id={id} />;
}

function AppDetailContent({ app, id }) {
  const { upvoteCount, downvoteCount, myVote, isLoading, isVoting, vote } = useVotes(id);

  const formattedDate = new Date(app.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const generationDuration =
    app.generation?.startTime && app.generation?.endTime
      ? Math.round((new Date(app.generation.endTime) - new Date(app.generation.startTime)) / 1000)
      : null;

  return (
    <>
      <div className="valley-cinematic-bg" aria-hidden="true">
        <div className="valley-mountain-row-back" />
        <div className="valley-mountain-row-mid" />
      </div>
      <div className="valley-light-veil" aria-hidden="true" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to gallery
        </Link>

        {/* Hero Image — click to launch */}
        <a href={app.appPath} target="_blank" rel="noopener" className="card overflow-hidden mb-8 block group/hero">
          <div className="aspect-video bg-gradient-to-br from-primary-400 to-primary-600 relative">
            {app.thumbnailUrl && (
              <img
                src={app.thumbnailUrl}
                alt={app.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl opacity-30">🤖</span>
            </div>
            {/* Play overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/hero:bg-black/30 transition-colors duration-200">
              <div className="flex flex-col items-center gap-2 opacity-0 group-hover/hero:opacity-100 transition-opacity duration-200">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-primary-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm drop-shadow">Launch App</span>
              </div>
            </div>
          </div>
        </a>

        {/* App Info */}
        <div id="app-info" className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{app.name}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-block px-3 py-1 text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                  {app.category}
                </span>
                <VoteButtons
                  upvoteCount={upvoteCount}
                  downvoteCount={downvoteCount}
                  myVote={myVote}
                  isLoading={isLoading}
                  isVoting={isVoting}
                  onVote={vote}
                  size="md"
                />
                <Link
                  href={`/improve?app=${encodeURIComponent(id)}&name=${encodeURIComponent(app.name)}`}
                  className="inline-flex items-center gap-0.5 text-[0.72rem] font-semibold tracking-wide text-slate-900 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full px-2 py-0.5 whitespace-nowrap transition-transform hover:scale-105"
                >
                  💡 Improve
                </Link>
                <span className="text-gray-500 dark:text-gray-400">{formattedDate}</span>
              </div>
            </div>

            <a
              href={app.appPath}
              target="_blank"
              rel="noopener noreferrer"
              className="animate-pulse-ring relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-600 hover:via-teal-500 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Launch App
            </a>
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-lg">{app.shortDescription}</p>

          {app.tags && app.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {app.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

        </div>

        {/* Generation Info */}
        {app.generation && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Generated by AI
              </h2>
              {githubUrl && (
                <a
                  href={`${githubUrl}/blob/main/apps/${id}/index.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  title="View source code on GitHub"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  Source
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Agent</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {app.generation.agentName}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500 dark:text-gray-400">Model</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {app.generation.llmModel}
                </dd>
              </div>
              {generationDuration && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Generation Time</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {generationDuration} seconds
                  </dd>
                </div>
              )}
              {app.generation.runId && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Run ID</dt>
                  <dd className="font-mono text-sm text-gray-900 dark:text-white">
                    {app.generation.runId}
                  </dd>
                </div>
              )}
              {app.generation.totalTokensIn && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Input Tokens</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {app.generation.totalTokensIn.toLocaleString()}
                  </dd>
                </div>
              )}
              {app.generation.totalTokensOut && (
                <div>
                  <dt className="text-sm text-gray-500 dark:text-gray-400">Output Tokens</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">
                    {app.generation.totalTokensOut.toLocaleString()}
                  </dd>
                </div>
              )}
            </div>
          </div>
        )}

        {/* App Log */}
        <div className="mt-8">
          <AppLog appId={id} suggestion={app.suggestion ?? null} />
        </div>
      </div>
    </>
  );
}
