import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import appsData from '@/data/apps.json';

export const metadata = {
  title: 'Leaderboards',
  description: 'Top scores across all Valley of AI games.',
};

export const revalidate = 60;

async function fetchTopScoresByApp() {
  const appIds = appsData.map((app) => app.id).filter(Boolean);

  const results = await Promise.all(
    appIds.map(async (appId) => {
      const { data, error } = await supabase
        .from('leaderboard_scores')
        .select('app_id, player_name, score')
        .eq('app_id', appId)
        .order('score', { ascending: false })
        .limit(3);

      if (error || !data) {
        return [appId, []];
      }

      return [
        appId,
        data.map((row, index) => ({ ...row, rank: index + 1 })),
      ];
    })
  );

  return Object.fromEntries(results);
}

function ScoreCard({ app, scores }) {
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Thumbnail */}
      <Link href={app.route} className="block relative aspect-video bg-gray-100 dark:bg-gray-900">
        <img
          src={app.thumbnailUrl}
          alt={app.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h2 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
            {app.name}
          </h2>
          <Link
            href={app.appPath}
            className="flex-shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Play →
          </Link>
        </div>

        {/* Top 3 scores */}
        <ol className="space-y-1 flex-1">
          {scores.map((entry, i) => (
            <li
              key={`${entry.app_id}-${entry.rank}-${entry.player_name}-${entry.score}`}
              className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="text-base leading-none">{medals[i] || `#${i + 1}`}</span>
                <span className="text-gray-700 dark:text-gray-300 truncate">
                  {entry.player_name}
                </span>
              </span>
              <span className="font-bold text-gray-900 dark:text-white tabular-nums flex-shrink-0 ml-2">
                {entry.score.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default async function LeaderboardPage() {
  const scoreGroups = await fetchTopScoresByApp();
  const appIds = Object.keys(scoreGroups);

  const appsWithScores = appsData
    .filter((app) => appIds.includes(app.id) && app.status === 'active')
    .sort((a, b) => {
      // Sort by number of scores desc, then by highest score desc
      const aTop = scoreGroups[a.id]?.[0]?.score ?? 0;
      const bTop = scoreGroups[b.id]?.[0]?.score ?? 0;
      return bTop - aTop;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Gallery
      </Link>

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          🏆 Leaderboards
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto text-sm">
          Top scores across all Valley of AI games. Play a game to get on the board!
        </p>
      </div>

      {appsWithScores.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🎮</p>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No scores yet!</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Play a game and be the first to post a high score.
          </p>
          <Link
            href="/"
            className="inline-block mt-6 px-6 py-2.5 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-500 transition-colors"
          >
            Browse Games
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {appsWithScores.map((app) => (
            <ScoreCard key={app.id} app={app} scores={scoreGroups[app.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
