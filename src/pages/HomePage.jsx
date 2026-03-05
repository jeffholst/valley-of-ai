import { useState, useMemo } from 'react'
import AppCard from '../components/AppCard'
import appsData from '../data/apps.json'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Highest rated' },
]

const PER_PAGE_OPTIONS = [10, 25, 100]

// Extract unique filter options from data
const categories = [...new Set(appsData.map(app => app.category).filter(Boolean))].sort()
const agents = [...new Set(appsData.map(app => app.generation?.agentName).filter(Boolean))].sort()
const models = [...new Set(appsData.map(app => app.generation?.llmModel).filter(Boolean))].sort()

export default function HomePage() {
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [agentFilter, setAgentFilter] = useState('')
  const [modelFilter, setModelFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const activeFilterCount = [categoryFilter, agentFilter, modelFilter, searchQuery].filter(Boolean).length

  const filteredApps = useMemo(() => {
    return appsData.filter(app => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          app.name?.toLowerCase().includes(query) ||
          app.shortDescription?.toLowerCase().includes(query) ||
          app.tags?.some(tag => tag.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }
      
      // Category filter
      if (categoryFilter && app.category !== categoryFilter) return false
      
      // Agent filter
      if (agentFilter && app.generation?.agentName !== agentFilter) return false
      
      // Model filter
      if (modelFilter && app.generation?.llmModel !== modelFilter) return false
      
      return true
    })
  }, [searchQuery, categoryFilter, agentFilter, modelFilter])

  const sortedApps = useMemo(() => {
    const apps = [...filteredApps]
    switch (sortBy) {
      case 'newest':
        return apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      case 'oldest':
        return apps.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      case 'highest':
        return apps.sort((a, b) => b.votes - a.votes)
      default:
        return apps
    }
  }, [filteredApps, sortBy])

  const totalPages = Math.ceil(sortedApps.length / perPage)
  
  const paginatedApps = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage
    return sortedApps.slice(startIndex, startIndex + perPage)
  }, [sortedApps, currentPage, perPage])

  const resetFilters = () => {
    setSearchQuery('')
    setCategoryFilter('')
    setAgentFilter('')
    setModelFilter('')
    setCurrentPage(1)
  }

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value)
    setCurrentPage(1)
  }

  const handleSortChange = (e) => {
    setSortBy(e.target.value)
    setCurrentPage(1)
  }

  const handlePerPageChange = (e) => {
    setPerPage(Number(e.target.value))
    setCurrentPage(1)
  }

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to the Valley of AI
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Explore a curated collection of AI-generated applications. Each app was created by AI agents and showcases the possibilities of automated software development.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <svg 
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search apps by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
              className="input pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-primary-100 dark:bg-primary-900 border-primary-300 dark:border-primary-700' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-primary-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="card p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="categoryFilter" className="label">Category</label>
                <select
                  id="categoryFilter"
                  value={categoryFilter}
                  onChange={handleFilterChange(setCategoryFilter)}
                  className="input"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="agentFilter" className="label">Agent</label>
                <select
                  id="agentFilter"
                  value={agentFilter}
                  onChange={handleFilterChange(setAgentFilter)}
                  className="input"
                >
                  <option value="">All Agents</option>
                  {agents.map(agent => (
                    <option key={agent} value={agent}>{agent}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="modelFilter" className="label">Model</label>
                <select
                  id="modelFilter"
                  value={modelFilter}
                  onChange={handleFilterChange(setModelFilter)}
                  className="input"
                >
                  <option value="">All Models</option>
                  {models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  disabled={activeFilterCount === 0 && !searchQuery}
                  className="btn-secondary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <p className="text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-white">{sortedApps.length}</span> apps available
        </p>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="perPage" className="text-sm text-gray-600 dark:text-gray-400">
              Show:
            </label>
            <select
              id="perPage"
              value={perPage}
              onChange={handlePerPageChange}
              className="input py-1.5 w-auto"
            >
              {PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm text-gray-600 dark:text-gray-400">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={handleSortChange}
              className="input py-1.5 w-auto"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Apps Grid */}
      {paginatedApps.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          {activeFilterCount > 0 || searchQuery ? (
            <>
              <p className="text-gray-500 dark:text-gray-400 mb-4">No apps match your filters.</p>
              <button onClick={resetFilters} className="btn-secondary">
                Clear Filters
              </button>
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No apps available yet.</p>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, sortedApps.length)} of {sortedApps.length}
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first, last, current, and adjacent pages
                  if (page === 1 || page === totalPages) return true
                  if (Math.abs(page - currentPage) <= 1) return true
                  return false
                })
                .reduce((acc, page, idx, arr) => {
                  // Add ellipsis where there are gaps
                  if (idx > 0 && page - arr[idx - 1] > 1) {
                    acc.push('...')
                  }
                  acc.push(page)
                  return acc
                }, [])
                .map((item, idx) => (
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => goToPage(item)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === item
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {item}
                    </button>
                  )
                ))}
            </div>
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
