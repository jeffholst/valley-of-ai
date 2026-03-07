import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'valley_voted_apps'

// Get voted apps from localStorage
function getVotedApps() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

// Save voted apps to localStorage
function saveVotedApps(votedApps) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votedApps))
  } catch {
    // Ignore storage errors
  }
}

// Check if user has voted for an app
export function hasVotedFor(appId) {
  const votedApps = getVotedApps()
  return !!votedApps[appId]
}

// Hook for managing votes on a single app
export function useVotes(appId) {
  const [voteCount, setVoteCount] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isVoting, setIsVoting] = useState(false)

  // Fetch vote count on mount
  useEffect(() => {
    async function fetchVotes() {
      setIsLoading(true)
      try {
        const { count, error } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('app_id', appId)

        if (error) throw error
        setVoteCount(count || 0)
      } catch (error) {
        console.error('Error fetching votes:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Check localStorage for existing vote
    setHasVoted(hasVotedFor(appId))
    fetchVotes()
  }, [appId])

  // Submit a vote
  const vote = useCallback(async () => {
    if (hasVoted || isVoting) return false

    setIsVoting(true)
    
    // Optimistic update
    setVoteCount((prev) => prev + 1)
    setHasVoted(true)

    try {
      const { error } = await supabase
        .from('votes')
        .insert({ app_id: appId })

      if (error) throw error

      // Save to localStorage
      const votedApps = getVotedApps()
      votedApps[appId] = Date.now()
      saveVotedApps(votedApps)

      return true
    } catch (error) {
      console.error('Error voting:', error)
      // Revert optimistic update
      setVoteCount((prev) => prev - 1)
      setHasVoted(false)
      return false
    } finally {
      setIsVoting(false)
    }
  }, [appId, hasVoted, isVoting])

  return {
    voteCount,
    hasVoted,
    isLoading,
    isVoting,
    vote,
  }
}

// Hook for fetching vote counts for multiple apps
export function useAllVoteCounts(appIds) {
  const [voteCounts, setVoteCounts] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAllVotes() {
      if (!appIds || appIds.length === 0) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('app_id')
          .in('app_id', appIds)

        if (error) throw error

        // Count votes per app
        const counts = {}
        appIds.forEach((id) => {
          counts[id] = 0
        })
        data?.forEach((row) => {
          counts[row.app_id] = (counts[row.app_id] || 0) + 1
        })

        setVoteCounts(counts)
      } catch (error) {
        console.error('Error fetching vote counts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllVotes()
  }, [JSON.stringify(appIds)])

  return { voteCounts, isLoading }
}
