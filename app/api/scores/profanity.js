import { Filter } from 'bad-words';

const filter = new Filter();

/**
 * Returns true if the given player name contains no profanity, false if it does.
 * Used server-side only to validate player names before storing in the leaderboard.
 */
export function isClean(name) {
  try {
    return !filter.isProfane(name);
  } catch {
    // isProfane can throw for unusual input; treat as unclean to be safe
    return false;
  }
}
