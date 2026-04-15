import { useState, useEffect, useCallback } from 'react';
import { storagePrefix } from '@/lib/siteConfig';

const STORAGE_KEY = `${storagePrefix}_versus_votes`;

function getMyVote(versusId) {
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    const records = stored ? JSON.parse(stored) : {};
    return records[versusId] || null;
  } catch {
    return null;
  }
}

function saveMyVote(versusId, appId) {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    const records = stored ? JSON.parse(stored) : {};
    records[versusId] = appId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage errors
  }
}

export function useVersusVotes(versusId) {
  const [voteCounts, setVoteCounts] = useState({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [myVote, setMyVote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    async function fetchVotes() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/versus-votes?versusId=${encodeURIComponent(versusId)}`);
        if (!res.ok) {
          console.error('Error fetching versus votes:', res.status);
          return;
        }
        const data = await res.json();

        const counts = {};
        for (const row of data || []) {
          counts[row.voted_app_id] = (counts[row.voted_app_id] || 0) + 1;
        }
        setVoteCounts(counts);
        setTotalVotes((data || []).length);
      } finally {
        setIsLoading(false);
      }
    }

    setMyVote(getMyVote(versusId));
    fetchVotes();
  }, [versusId]);

  const vote = useCallback(
    async (appId) => {
      if (myVote || isVoting) {
        return;
      }
      setIsVoting(true);

      // Optimistic update
      setMyVote(appId);
      setVoteCounts((prev) => ({
        ...prev,
        [appId]: (prev[appId] || 0) + 1,
      }));
      setTotalVotes((prev) => prev + 1);

      try {
        const res = await fetch('/api/versus-votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ versusId, votedAppId: appId }),
        });

        if (!res.ok) {
          console.error('Error submitting versus vote:', res.status);
          // Revert optimistic update
          setMyVote(null);
          setVoteCounts((prev) => ({
            ...prev,
            [appId]: Math.max((prev[appId] || 1) - 1, 0),
          }));
          setTotalVotes((prev) => prev - 1);
          return;
        }

        saveMyVote(versusId, appId);
      } finally {
        setIsVoting(false);
      }
    },
    [versusId, myVote, isVoting]
  );

  return { voteCounts, totalVotes, myVote, isLoading, isVoting, vote };
}

export function useAllVersusVoteCounts(versusIds) {
  const [voteCounts, setVoteCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      if (!versusIds || versusIds.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/versus-votes?versusIds=${encodeURIComponent(versusIds.join(','))}`
        );
        if (!res.ok) {
          console.error('Error fetching all versus votes:', res.status);
          return;
        }
        const data = await res.json();

        const counts = {};
        for (const row of data || []) {
          if (!counts[row.versus_id]) {
            counts[row.versus_id] = { total: 0, byApp: {} };
          }
          counts[row.versus_id].total += 1;
          counts[row.versus_id].byApp[row.voted_app_id] =
            (counts[row.versus_id].byApp[row.voted_app_id] || 0) + 1;
        }
        setVoteCounts(counts);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAll();
  }, [JSON.stringify(versusIds)]);

  return { voteCounts, isLoading };
}
