/**
 * Escape Markdown metacharacters and strip newlines to prevent injection
 * into GitHub issue bodies and other Markdown contexts.
 *
 * @param {string} str
 * @returns {string}
 */
export function escapeMd(str) {
  return str.replace(/[\r\n]/g, ' ').replace(/[\\`*_{}[\]()#+.!|~<>-]/g, '\\$&');
}
