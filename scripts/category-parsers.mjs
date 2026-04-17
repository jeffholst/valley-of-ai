/**
 * Pure helper functions for parsing category lists out of project files.
 *
 * No filesystem access — safe to import from both the CLI script and test suites.
 */

/**
 * Extracts the ordered list of category options from the app_suggestion.yml
 * issue template content. Returns null when the expected block is not found.
 *
 * @param {string} content - Raw file content of app_suggestion.yml
 * @returns {string[] | null}
 */
export function parseIssueTemplateCategories(content) {
  const optionsBlockPattern =
    /(id:\s*category[\s\S]*?^\s*options:\s*\n)([\s\S]*?)(^\s*validations:\s*\n)/m;
  const match = content.match(optionsBlockPattern);

  if (!match) {
    return null;
  }

  return match[2]
    .split('\n')
    .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1]?.trim())
    .filter(Boolean);
}

/**
 * Extracts the ordered list of categories from the shared agent-prompt
 * category line (e.g. "- `category`: one of `Games` | `Productivity`").
 * Returns null when the expected line is not found.
 *
 * @param {string} content - Raw file content of AGENT_PROMPT_SHARED.md
 * @returns {string[] | null}
 */
export function parseSharedPromptCategories(content) {
  const categoryLineMatch = content.match(/- `category`: one of (.+)$/m);
  if (!categoryLineMatch) {
    return null;
  }

  return categoryLineMatch[1]
    .split('|')
    .map((token) => token.trim().replace(/^`|`$/g, ''))
    .filter(Boolean);
}
