import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🏔️</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Valley of AI
            </span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              to="/suggest"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-200"
            >
              Suggest
            </Link>
            {import.meta.env.DEV && (
              <Link
                to="/logs"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-200"
              >
                Logs
              </Link>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  )
}
