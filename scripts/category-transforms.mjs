/**
 * Pure helper functions for applying category list updates to file content strings.
 *
 * No filesystem access — safe to import from both the CLI script and test suites.
 */

/**
 * Replaces the category enum values inside a versus-schema JSON string.
 * Throws when the expected enum block is not found.
 *
 * @param {string} content - Raw content of schemas/versus.json
 * @param {string[]} categories - Ordered list of canonical category values
 * @returns {string} Updated file content
 */
export function transformVersusSchema(content, categories) {
  const enumBlockPattern =
    /("category"\s*:\s*\{\s*"type"\s*:\s*"string"\s*,\s*"enum"\s*:\s*\[)([\s\S]*?)(\]\s*\})/m;
  const match = content.match(enumBlockPattern);

  if (!match) {
    throw new Error('schemas/versus.json is missing items.properties.category.enum');
  }

  const indentMatch = match[2].match(/\n(\s*)"/);
  const valueIndent = indentMatch?.[1] ?? '          ';
  const enumValues = categories.map((category) => `${valueIndent}"${category}"`).join(',\n');
  return content.replace(
    enumBlockPattern,
    `${match[1]}\n${enumValues}\n${valueIndent.slice(0, -2)}${match[3]}`
  );
}

/**
 * Replaces the category options list inside an issue-template YAML string.
 * Throws when the expected options block is not found.
 *
 * @param {string} content - Raw content of .github/ISSUE_TEMPLATE/app_suggestion.yml
 * @param {string[]} categories - Ordered list of canonical category values
 * @returns {string} Updated file content
 */
export function transformIssueTemplate(content, categories) {
  const optionsBlockPattern =
    /(id:\s*category[\s\S]*?^\s*options:\s*\n)([\s\S]*?)(^\s*validations:\s*\n)/m;
  const match = content.match(optionsBlockPattern);

  if (!match) {
    throw new Error(
      'Could not find the category options block in .github/ISSUE_TEMPLATE/app_suggestion.yml'
    );
  }

  const itemIndentMatch = match[2].match(/^(\s*)-\s+/m);
  const itemIndent = itemIndentMatch?.[1] ?? '        ';
  const optionsList = categories.map((category) => `${itemIndent}- ${category}`).join('\n');
  return content.replace(optionsBlockPattern, `${match[1]}${optionsList}\n${match[3]}`);
}

/**
 * Replaces the inline category list in the shared agent-prompt markdown string.
 * Throws when the expected category line is not found.
 *
 * @param {string} content - Raw content of pipelines/prompts/shared.md
 * @param {string[]} categories - Ordered list of canonical category values
 * @returns {string} Updated file content
 */
export function transformSharedPrompt(content, categories) {
  const categoryLinePattern = /- `category`: one of .*$/m;
  const categoryList = categories.map((category) => `\`${category}\``).join(' | ');
  const replacement = `- \`category\`: one of ${categoryList}`;

  if (!categoryLinePattern.test(content)) {
    throw new Error('Could not find the category line in pipelines/prompts/shared.md');
  }

  return content.replace(categoryLinePattern, replacement);
}
