'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import VersusCard from '@/components/VersusCard';
import { useAllVersusVoteCounts } from '@/hooks/useVersusVotes';

import versusData from '@/data/versus-registry.json';

const allVersusIds = versusData.map((c) => c.id);

export default function VersusPage() {
  const { voteCounts, isLoading: _votesLoading } = useAllVersusVoteCounts(allVersusIds);

  const competitions = useMemo(() => {
    return [...versusData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, []);

  return (
    <>
      <div className="valley-cinematic-bg" aria-hidden="true">
        <div className="valley-mountain-row-back" />
        <div className="valley-mountain-row-mid" />
      </div>
      <div className="valley-light-veil" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
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
          Back to Gallery
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Model Versus
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Same prompt, different models. Compare AI-generated apps side by side and vote for your
            favorite. See how different LLMs interpret the same challenge.
          </p>
        </div>

        {/* Competition grid */}
        {competitions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">
              No competitions yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((comp) => (
              <VersusCard key={comp.id} competition={comp} voteTotals={voteCounts[comp.id]} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
