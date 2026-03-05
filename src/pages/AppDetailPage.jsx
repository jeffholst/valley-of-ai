import { useParams, Link } from 'react-router-dom'
import appsData from '../data/apps.json'

export default function AppDetailPage() {
  const { id } = useParams()
  const app = appsData.find((a) => a.id === id)

  if (!app) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          App Not Found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The app you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    )
  }

  const formattedDate = new Date(app.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const generationDuration = app.generation?.startTime && app.generation?.endTime
    ? Math.round((new Date(app.generation.endTime) - new Date(app.generation.startTime)) / 1000)
    : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to gallery
      </Link>

      {/* Hero Image */}
      <div className="card overflow-hidden mb-8">
        <div className="aspect-video bg-gradient-to-br from-primary-400 to-primary-600 relative">
          {app.thumbnailUrl && (
            <img
              src={app.thumbnailUrl}
              alt={app.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl opacity-30">🤖</span>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {app.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-block px-3 py-1 text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                {app.category}
              </span>
              <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {app.votes} votes
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {formattedDate}
              </span>
            </div>
          </div>
          
          <a
            href={app.appPath}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Open App
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-lg">
          {app.shortDescription}
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

      {/* Generation Info */}
      {app.generation && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Generated by AI
          </h2>
          
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
    </div>
  )
}
