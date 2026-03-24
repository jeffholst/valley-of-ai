/**
 * Format a duration in milliseconds to a human-readable string.
 *
 * @param {number|null|undefined} ms
 * @returns {string}  e.g. "350ms", "4.2s", "2m 7s", or "-" for falsy input
 */
export function formatDuration(ms) {
  if (!ms) {
    return '-';
  }
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}
