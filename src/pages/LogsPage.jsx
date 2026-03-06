import { useState, useEffect, useMemo } from 'react'

/**
 * Logs Dashboard Page
 * 
 * Displays transactional logs for agent app generation.
 * Features:
 * - Transaction view grouped by runId
 * - Step-by-step progress tracking
 * - Error highlighting
 * - Date navigation
 * - Filter by status
 */

// Step type display names and icons
const STEP_INFO = {
  SELECT_SUGGESTION: { name: 'Select Suggestion', icon: '💡' },
  GENERATE_HTML: { name: 'Generate HTML', icon: '📝' },
  GENERATE_THUMBNAIL: { name: 'Generate Thumbnail', icon: '🎨' },
  CREATE_META_JSON: { name: 'Create Metadata', icon: '📋' },
  VALIDATE_APP: { name: 'Validate App', icon: '✅' },
  GIT_BRANCH: { name: 'Create Branch', icon: '🌿' },
  GIT_COMMIT: { name: 'Git Commit', icon: '💾' },
  CREATE_PR: { name: 'Create PR', icon: '📬' },
  PR_REVIEW: { name: 'Review PR', icon: '👀' },
  MERGE_PR: { name: 'Merge PR', icon: '🔀' },
  UPDATE_REGISTRY: { name: 'Update Registry', icon: '📚' },
  DEPLOY: { name: 'Deploy', icon: '🚀' },
}

// Status colors
const STATUS_COLORS = {
  started: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  retrying: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  skipped: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
}

function formatDuration(ms) {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function formatTimestamp(ts) {
  const date = new Date(ts)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function StatusBadge({ status }) {
  const colorClass = STATUS_COLORS[status] || STATUS_COLORS.started
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  )
}

function StepRow({ entry }) {
  const stepInfo = STEP_INFO[entry.step] || { name: entry.step, icon: '⚡' }
  
  return (
    <div className={`flex items-center gap-3 py-2 px-3 border-l-2 ml-4 ${
      entry.status === 'failed' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
      entry.status === 'completed' ? 'border-green-500' :
      entry.status === 'retrying' ? 'border-orange-500' :
      'border-gray-300 dark:border-gray-600'
    }`}>
      <span className="text-lg">{stepInfo.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-900 dark:text-white">
            {stepInfo.name}
          </span>
          <StatusBadge status={entry.status} />
          {entry.attempt && entry.attempt > 1 && (
            <span className="text-xs text-orange-600 dark:text-orange-400">
              Attempt #{entry.attempt}
            </span>
          )}
        </div>
        {entry.error && (
          <div className="mt-1 text-xs text-red-600 dark:text-red-400">
            <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">{entry.error.code}</code>
            {' '}{entry.error.message}
          </div>
        )}
        {entry.details && (
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {Object.entries(entry.details).map(([key, value]) => (
              <span key={key} className="mr-3">
                <span className="font-medium">{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-right text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
        <div>{formatTimestamp(entry.timestamp)}</div>
        {entry.durationMs && <div>{formatDuration(entry.durationMs)}</div>}
        {(entry.tokensIn || entry.tokensOut) && (
          <div className="text-gray-400">
            {entry.tokensIn && <span>↓{entry.tokensIn}</span>}
            {entry.tokensIn && entry.tokensOut && ' / '}
            {entry.tokensOut && <span>↑{entry.tokensOut}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function TransactionCard({ transaction, entries }) {
  const [expanded, setExpanded] = useState(true)
  
  const startEntry = entries.find(e => e.type === 'TRANSACTION_START')
  const endEntry = entries.find(e => e.type === 'TRANSACTION_END')
  const stepEntries = entries.filter(e => e.type === 'STEP')
  
  const status = endEntry?.status || startEntry?.status || 'started'
  const isSuccess = status === 'success'
  const isFailed = status === 'failed'
  
  return (
    <div className={`card mb-4 ${
      isFailed ? 'ring-2 ring-red-500' : 
      isSuccess ? 'ring-1 ring-green-500/30' : ''
    }`}>
      {/* Transaction header */}
      <div 
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
        onClick={() => setExpanded(!expanded)}
      >
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <svg 
            className={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white">
              {transaction.appId || 'Unknown App'}
            </span>
            <StatusBadge status={status} />
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
              {transaction.runId}
            </code>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span>{startEntry ? formatTimestamp(startEntry.timestamp) : '-'}</span>
            {transaction.agent && <span className="mx-2">•</span>}
            {transaction.agent && <span>{transaction.agent}</span>}
            {transaction.llmModel && <span className="mx-2">•</span>}
            {transaction.llmModel && <span>{transaction.llmModel}</span>}
          </div>
        </div>
        
        <div className="text-right text-sm">
          {endEntry && (
            <>
              <div className="text-gray-900 dark:text-white font-medium">
                {formatDuration(endEntry.totalDurationMs)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {endEntry.totalTokensIn + endEntry.totalTokensOut > 0 && (
                  <span>
                    {(endEntry.totalTokensIn + endEntry.totalTokensOut).toLocaleString()} tokens
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Steps */}
      {expanded && stepEntries.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 py-2">
          {stepEntries.map((entry, idx) => (
            <StepRow key={`${entry.step}-${entry.timestamp}-${idx}`} entry={entry} />
          ))}
        </div>
      )}
      
      {/* End summary */}
      {expanded && endEntry && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50 text-sm">
          <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-400">
            <span>
              <span className="font-medium">Duration:</span> {formatDuration(endEntry.totalDurationMs)}
            </span>
            <span>
              <span className="font-medium">Tokens:</span> ↓{endEntry.totalTokensIn?.toLocaleString() || 0} / ↑{endEntry.totalTokensOut?.toLocaleString() || 0}
            </span>
            {endEntry.filesCreated?.length > 0 && (
              <span>
                <span className="font-medium">Files:</span> {endEntry.filesCreated.join(', ')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function LogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Parse date for file path
  const dateParts = useMemo(() => {
    const [year, month, day] = selectedDate.split('-')
    return { year, month, day }
  }, [selectedDate])
  
  // Fetch logs for selected date
  useEffect(() => {
    async function fetchLogs() {
      setLoading(true)
      setError(null)
      
      try {
        const { year, month, day } = dateParts
        const response = await fetch(`/logs/${year}/${month}/${day}.jsonl`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setLogs([])
            return
          }
          throw new Error(`Failed to fetch logs: ${response.status}`)
        }
        
        const text = await response.text()
        const entries = text
          .split('\n')
          .filter(line => line.trim())
          .map(line => {
            try {
              return JSON.parse(line)
            } catch {
              return null
            }
          })
          .filter(Boolean)
        
        setLogs(entries)
      } catch (err) {
        setError(err.message)
        setLogs([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchLogs()
  }, [dateParts])
  
  // Group logs by transaction (runId)
  const transactions = useMemo(() => {
    const grouped = new Map()
    
    for (const entry of logs) {
      const runId = entry.runId
      if (!runId) continue
      
      if (!grouped.has(runId)) {
        grouped.set(runId, {
          runId,
          appId: entry.appId,
          agent: entry.agent,
          llmModel: entry.llmModel,
          entries: [],
        })
      }
      
      const txn = grouped.get(runId)
      txn.entries.push(entry)
      
      // Update transaction metadata from entries
      if (entry.appId) txn.appId = entry.appId
      if (entry.agent) txn.agent = entry.agent
      if (entry.llmModel) txn.llmModel = entry.llmModel
    }
    
    // Sort entries within each transaction by timestamp
    for (const txn of grouped.values()) {
      txn.entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    }
    
    // Convert to array and sort by first entry timestamp (newest first)
    return Array.from(grouped.values()).sort((a, b) => {
      const aTime = a.entries[0]?.timestamp || ''
      const bTime = b.entries[0]?.timestamp || ''
      return bTime.localeCompare(aTime)
    })
  }, [logs])
  
  // Filter transactions by status
  const filteredTransactions = useMemo(() => {
    if (statusFilter === 'all') return transactions
    
    return transactions.filter(txn => {
      const endEntry = txn.entries.find(e => e.type === 'TRANSACTION_END')
      const status = endEntry?.status || 'started'
      
      if (statusFilter === 'success') return status === 'success'
      if (statusFilter === 'failed') return status === 'failed'
      if (statusFilter === 'in_progress') return !endEntry
      return true
    })
  }, [transactions, statusFilter])
  
  // Stats
  const stats = useMemo(() => {
    let success = 0, failed = 0, inProgress = 0, totalTokens = 0, totalDuration = 0
    
    for (const txn of transactions) {
      const endEntry = txn.entries.find(e => e.type === 'TRANSACTION_END')
      if (!endEntry) {
        inProgress++
      } else if (endEntry.status === 'success') {
        success++
        totalTokens += (endEntry.totalTokensIn || 0) + (endEntry.totalTokensOut || 0)
        totalDuration += endEntry.totalDurationMs || 0
      } else {
        failed++
      }
    }
    
    return { success, failed, inProgress, totalTokens, totalDuration }
  }, [transactions])
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📊 Agent Logs
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor app generation transactions, step progress, and errors.
        </p>
      </div>
      
      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="in_progress">In Progress</option>
          </select>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{transactions.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.success}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Success</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Failed</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">In Progress</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalTokens > 0 ? `${(stats.totalTokens / 1000).toFixed(1)}k` : '0'}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Tokens</div>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading logs...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="card p-6 text-center border-red-500 bg-red-50 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {/* Empty state */}
      {!loading && !error && filteredTransactions.length === 0 && (
        <div className="card p-12 text-center">
          <span className="text-4xl">📭</span>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            No logs found for {selectedDate}
          </p>
        </div>
      )}
      
      {/* Transactions list */}
      {!loading && !error && filteredTransactions.map(txn => (
        <TransactionCard 
          key={txn.runId} 
          transaction={txn} 
          entries={txn.entries} 
        />
      ))}
    </div>
  )
}
