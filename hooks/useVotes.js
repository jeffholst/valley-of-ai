import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { storagePrefix } from '@/lib/siteConfig';

const STORAGE_KEY = `${storagePrefix}_votes_v2`;
const LEGACY_STORAGE_KEY = `${storagePrefix}_voted_apps`;

function getVoteRecord(appId) {
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    const records = stored ? JSON.parse(stored) : {};
    if (records[appId]) {
      return records[appId];
    }
    // Migrate legacy upvote
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    const legacyRecords = legacy ? JSON.parse(legacy) : {};
    if (legacyRecords[appId]) {
      return { type: 'up', ts: legacyRecords[appId] };
    }
    return null;
  } catch {
    return null;
  }
}

function saveVoteRecord(appId, type) {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    const records = stored ? JSON.parse(stored) : {};
    records[appId] = { type, ts: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage errors
  }
}

// Hook for managing votes on a single app
export function useVotes(appId) {
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [downvoteCount, setDownvoteCount] = useState(0);
  const [myVote, setMyVote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    async function fetchVotes() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('vote_type')
          .eq('app_id', appId);

        if (error) {
          throw error;
        }

        const ups = data?.filter((r) => r.vote_type === 'up').length ?? 0;
        const downs = data?.filter((r) => r.vote_type === 'down').length ?? 0;
        setUpvoteCount(ups);
        setDownvoteCount(downs);
      } catch (error) {
        console.error('Error fetching votes:', error);
      } finally {
        setIsLoading(false);
      }
    }

    const record = getVoteRecord(appId);
    setMyVote(record?.type ?? null);
    fetchVotes();
  }, [appId]);

  const vote = useCallback(
    async (type) => {
      if (myVote || isVoting) {
        return false;
      }

      setIsVoting(true);

      // Optimistic update
      if (type === 'up') {
        setUpvoteCount((prev) => prev + 1);
      } else {
        setDownvoteCount((prev) => prev + 1);
      }
      setMyVote(type);

      try {
        const { error } = await supabase.from('votes').insert({ app_id: appId, vote_type: type });
        if (error) {
          throw error;
        }
        saveVoteRecord(appId, type);
        return true;
      } catch (error) {
        console.error('Error voting:', error);
        // Revert optimistic update
        if (type === 'up') {
          setUpvoteCount((prev) => prev - 1);
        } else {
          setDownvoteCount((prev) => prev - 1);
        }
        setMyVote(null);
        return false;
      } finally {
        setIsVoting(false);
      }
    },
    [appId, myVote, isVoting]
  );

  return { upvoteCount, downvoteCount, myVote, isLoading, isVoting, vote };
}

// Hook for gallery cards — initializes counts from bulk data (no per-card Supabase SELECT).
// The voting mutation (INSERT) still runs per-card when a user votes.
export function useVotesMutation(appId, initialCounts) {
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [downvoteCount, setDownvoteCount] = useState(0);
  const [myVote, setMyVote] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  // Track whether we've applied the first valid initialCounts so we don't
  // overwrite an in-flight optimistic update when the parent re-renders.
  const initializedRef = useRef(false);

  // Apply bulk counts once — the first time valid counts arrive.
  useEffect(() => {
    if (!initializedRef.current && initialCounts) {
      setUpvoteCount(initialCounts.up ?? 0);
      setDownvoteCount(initialCounts.down ?? 0);
      initializedRef.current = true;
    }
  }, [initialCounts]);

  // Read user's prior vote from localStorage (client-only, instant).
  useEffect(() => {
    setMyVote(getVoteRecord(appId)?.type ?? null);
  }, [appId]);

  const vote = useCallback(
    async (type) => {
      if (myVote || isVoting) {
        return false;
      }
      setIsVoting(true);
      // Optimistic update
      if (type === 'up') {
        setUpvoteCount((prev) => prev + 1);
      } else {
        setDownvoteCount((prev) => prev + 1);
      }
      setMyVote(type);
      try {
        const { error } = await supabase.from('votes').insert({ app_id: appId, vote_type: type });
        if (error) {
          throw error;
        }
        saveVoteRecord(appId, type);
        return true;
      } catch (error) {
        console.error('Error voting:', error);
        // Revert optimistic update
        if (type === 'up') {
          setUpvoteCount((prev) => prev - 1);
        } else {
          setDownvoteCount((prev) => prev - 1);
        }
        setMyVote(null);
        return false;
      } finally {
        setIsVoting(false);
      }
    },
    [appId, myVote, isVoting]
  );

  return { upvoteCount, downvoteCount, myVote, isLoading: false, isVoting, vote };
}

// Hook for fetching vote counts for multiple apps (used by gallery sorts).
// Returns { up, down, net, recentNet } per app where recentNet is the net
// votes cast in the last 7 days — used by the Trending sort.
export function useAllVoteCounts(appIds) {
  const [voteCounts, setVoteCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAllVotes() {
      if (!appIds || appIds.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('app_id, vote_type, voted_at')
          .in('app_id', appIds);

        if (error) {
          throw error;
        }

        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const counts = {};
        appIds.forEach((id) => {
          counts[id] = { up: 0, down: 0, net: 0, recentNet: 0 };
        });
        data?.forEach((row) => {
          if (!counts[row.app_id]) {
            counts[row.app_id] = { up: 0, down: 0, net: 0, recentNet: 0 };
          }
          const isUp = row.vote_type === 'up';
          if (isUp) {
            counts[row.app_id].up += 1;
          } else {
            counts[row.app_id].down += 1;
          }
          counts[row.app_id].net = counts[row.app_id].up - counts[row.app_id].down;
          if (row.voted_at && new Date(row.voted_at).getTime() >= sevenDaysAgo) {
            counts[row.app_id].recentNet += isUp ? 1 : -1;
          }
        });

        setVoteCounts(counts);
      } catch (error) {
        console.error('Error fetching vote counts:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllVotes();
  }, [JSON.stringify(appIds)]);

  return { voteCounts, isLoading };
}
