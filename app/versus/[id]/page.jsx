'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import VersusEntryCard from '@/components/VersusEntryCard';
import VersusComparisonTable from '@/components/VersusComparisonTable';
import VersusVoteBar from '@/components/VersusVoteBar';
import { useVersusVotes } from '@/hooks/useVersusVotes';

import versusData from '@/data/versus-registry.json';

export default function VersusDetailPage() {
  const params = useParams();
  const competition = versusData.find((c) => c.id === params.id);

  if (!competition) {
    notFound();
  }

  return <VersusDetailContent competition={competition} />;
}

function VersusDetailContent({ competition }) {
  const { voteCounts, totalVotes, myVote, isLoading, isVoting, vote } = useVersusVotes(
    competition.id
  );

  const formattedDate = new Date(competition.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <div className="valley-cinematic-bg" aria-hidden="true">
        <div className="valley-mountain-row-back" />
        <div className="valley-mountain-row-mid" />
      </div>
      <div className="valley-light-veil" aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/versus"
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
          Back to Versus
        </Link>

        {/* Header */}
        <div className="card p-6 mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {competition.title}
              </h1>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {competition.category}
                </span>
                <span>{formattedDate}</span>
                <span>
                  {competition.entries.length} model{competition.entries.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Shared prompt */}
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Shared Prompt
            </h2>
            <p className="text-gray-700 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
              {competition.prompt}
            </p>
          </div>
        </div>

        {/* Vote bar */}
        <div className="card p-4 mb-8">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Vote Results ({totalVotes} total)
          </h2>
          <VersusVoteBar
            entries={competition.entries}
            voteCounts={voteCounts}
            totalVotes={totalVotes}
            isLoading={isLoading}
          />
        </div>

        {/* Head-to-head comparison table */}
        <VersusComparisonTable entries={competition.entries} />

        {/* Entry cards grid */}
        <div
          className={`grid gap-6 ${
            competition.entries.length === 2
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {competition.entries.map((entry, i) => (
            <VersusEntryCard
              key={entry.appId}
              entry={entry}
              entryIndex={i}
              myVote={myVote}
              isVoting={isVoting}
              isLoading={isLoading}
              onVote={vote}
            />
          ))}
        </div>
      </div>
    </>
  );
}
