import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="text-8xl mb-6">🏔️</div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        404 - Page Not Found
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Looks like you&apos;ve wandered into an unexplored valley. Let&apos;s get you back on track.
      </p>
      <Link href="/" className="btn-primary">
        Return Home
      </Link>
    </div>
  )
}
