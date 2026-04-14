'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useVotes } from '@/hooks/useVotes';
import VoteButtons from '@/components/VoteButtons';
import AppLog from '@/components/AppLog';
import { githubUrl, siteName } from '@/lib/siteConfig';

export default function AppDetailClient({ app, id }) {
  const { upvoteCount, downvoteCount, myVote, isLoading, isVoting, vote } = useVotes(id);
  const [selectedVersionUrl, setSelectedVersionUrl] = useState(app.appPath);
  const [shareOpen, setShareOpen] = useState(false);
  const [copyLabel, setCopyLabel] = useState('Copy link');

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

  const previewMediaUrl =
    app.previewVideoUrl ||
    app.previewGifUrl ||
    app.previewMediaUrl ||
    app.previewVideo ||
    app.thumbnailUrl ||
    '';
  const previewPath = previewMediaUrl ? previewMediaUrl.toLowerCase().split('?')[0] : '';
  const isImagePreview = previewPath
    ? ['.gif', '.png', '.jpg', '.jpeg', '.webp', '.svg'].some((ext) => previewPath.endsWith(ext))
    : false;

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `Check out ${app.name} — an AI-generated app on ${siteName}.`;
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy link'), 2000);
    } catch {
      setCopyLabel('Failed');
      setTimeout(() => setCopyLabel('Copy link'), 2000);
    }
  }

  // Use native share sheet on mobile (small screens); show popover on desktop.
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

  async function handleShareButton() {
    if (isMobile && navigator.share) {
      try {
        await navigator.share({ title: app.name, text: shareText, url: pageUrl });
        return;
      } catch {
        /* user cancelled — fall through to popover */
      }
    }
    setShareOpen((o) => !o);
  }

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
        <a
          href={app.appPath}
          target="_blank"
          rel="noopener noreferrer"
          className="card overflow-hidden mb-8 block group/hero focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <div className="aspect-video bg-gradient-to-br from-primary-400 to-primary-600 relative">
            {app.thumbnailUrl && (
              <img
                src={app.thumbnailUrl}
                alt={`${app.name} gameplay screenshot showing bricks and paddle`}
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/hero:bg-black/30 group-focus-visible/hero:bg-black/30 transition-colors duration-200">
              <div className="flex flex-col items-center gap-2 opacity-0 group-hover/hero:opacity-100 group-focus-visible/hero:opacity-100 transition-opacity duration-200">
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <svg
                    className="w-7 h-7 text-primary-600 ml-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
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
                {app.allowImprovements !== false ? (
                  <Link
                    href={`/improve?app=${encodeURIComponent(id)}&name=${encodeURIComponent(app.name)}`}
                    className="inline-flex items-center gap-0.5 text-[0.72rem] font-semibold tracking-wide text-slate-900 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full px-2 py-0.5 whitespace-nowrap transition-transform hover:scale-105"
                  >
                    💡 Improve
                  </Link>
                ) : (
                  <span
                    className="inline-flex items-center gap-0.5 text-[0.72rem] font-semibold tracking-wide text-slate-500 bg-slate-200 dark:bg-slate-700 dark:text-slate-400 rounded-full px-2 py-0.5 whitespace-nowrap"
                    title="Improvements are disabled for this app"
                  >
                    🔒 Locked
                  </span>
                )}
                <span className="text-gray-500 dark:text-gray-400">{formattedDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={selectedVersionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="animate-pulse-ring relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-600 hover:via-teal-500 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Launch App
              </a>
              <div className="relative">
                <button
                  type="button"
                  onClick={handleShareButton}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 8a3 3 0 1 0-2.83-4H12a3 3 0 1 0 0 2h3.17A3 3 0 0 0 18 8zm0 8a3 3 0 1 0-2.83-4H12a3 3 0 1 0 0 2h3.17A3 3 0 0 0 18 16zM8 12H6"
                    />
                  </svg>
                  Share
                </button>
                {shareOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      role="presentation"
                      onClick={() => setShareOpen(false)}
                      onKeyDown={(e) => e.key === 'Escape' && setShareOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 z-20 w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg py-1">
                      <a
                        href={xShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShareOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        Share on X
                      </a>
                      <a
                        href={fbShareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShareOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Share on Facebook
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <svg
                          className="w-4 h-4 shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        {copyLabel}
                      </button>
                    </div>
                  </>
                )}
              </div>
              {app.backups && app.backups.length > 0 && (
                <select
                  value={selectedVersionUrl}
                  onChange={(e) => setSelectedVersionUrl(e.target.value)}
                  className="text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Select app version"
                >
                  <option value={app.appPath}>Current (latest)</option>
                  {app.backups.map((b) => (
                    <option key={b.runId} value={b.url}>
                      {b.runId}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-lg">{app.shortDescription}</p>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-3">
            {app.name} is an AI-generated{' '}
            {app.category ? `${app.category.toLowerCase()} app` : 'web app'} built by{' '}
            {app.generation?.agentName || 'an AI agent'}
            {app.generation?.llmModel ? ` using ${app.generation.llmModel}` : ''}. It runs entirely
            in the browser{app.tags?.length ? ` and is tagged: ${app.tags.join(', ')}` : ''}.
          </p>

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

        {previewMediaUrl && (
          <div className="card p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Gameplay Preview
            </h2>
            <div className="aspect-video rounded-xl overflow-hidden bg-slate-900">
              {isImagePreview ? (
                <img
                  src={previewMediaUrl}
                  alt={`${app.name} gameplay preview`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <video
                  src={previewMediaUrl}
                  poster={app.thumbnailUrl || undefined}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  loop
                  autoPlay
                  controls
                />
              )}
            </div>
          </div>
        )}

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

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </dl>
          </div>
        )}

        {/* App Log */}
        <div className="mt-8">
          <AppLog
            appId={id}
            suggestion={app.suggestion ?? null}
            improvements={app.improvements ?? null}
            generation={app.generation ?? null}
          />
        </div>
      </div>
    </>
  );
}
