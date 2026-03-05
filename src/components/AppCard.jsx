import { Link } from 'react-router-dom'

export default function AppCard({ app }) {
  const formattedDate = new Date(app.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link to={`/apps/${app.id}`} className="card overflow-hidden group">
      <div className="aspect-video bg-gradient-to-br from-primary-400 to-primary-600 relative overflow-hidden">
        {app.thumbnailUrl ? (
          <img
            src={app.thumbnailUrl}
            alt={app.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl opacity-50">🤖</span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {app.name}
          </h3>
          <span className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {app.votes}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
          {app.shortDescription}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
            {app.category}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formattedDate}
          </span>
        </div>
      </div>
    </Link>
  )
}
