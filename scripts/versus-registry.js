/**
 * Shared helpers for building and validating the versus registry.
 *
 * Pure functions with no filesystem dependencies — safe to import
 * from both the CLI script and test suites.
 */

export function validateVersusData(competitions, appsById) {
  const errors = [];
  const seenIds = new Set();

  for (const comp of competitions) {
    const hasValidId = typeof comp.id === 'string' && comp.id.length > 0;

    // Required fields
    if (!hasValidId) {
      errors.push('competition missing or invalid id');
    } else {
      // Duplicate ID check
      if (seenIds.has(comp.id)) {
        errors.push(`duplicate competition id: "${comp.id}"`);
      }
      seenIds.add(comp.id);
    }
    if (!comp.title || typeof comp.title !== 'string') {
      errors.push(`${comp.id}: missing or invalid title`);
    }
    if (!comp.prompt || typeof comp.prompt !== 'string') {
      errors.push(`${comp.id}: missing or invalid prompt`);
    }
    if (!comp.createdAt) {
      errors.push(`${comp.id}: missing createdAt`);
    }
    if (!comp.category) {
      errors.push(`${comp.id}: missing category`);
    }

    // Entries validation
    if (!Array.isArray(comp.entries)) {
      errors.push(`${comp.id}: entries must be an array`);
      continue;
    }
    if (comp.entries.length < 2) {
      errors.push(`${comp.id}: must have at least 2 entries, got ${comp.entries.length}`);
    }

    // Check each entry references a valid app
    for (const entry of comp.entries) {
      if (!entry || typeof entry !== 'object') {
        errors.push(`${comp.id}: entry must be a non-null object`);
        continue;
      }
      if (!entry.appId) {
        errors.push(`${comp.id}: entry missing appId`);
        continue;
      }
      if (!appsById.has(entry.appId)) {
        errors.push(`${comp.id}: entry appId "${entry.appId}" not found in apps.json`);
      }
    }

    // Check for duplicate entries within a competition
    const entryIds = comp.entries
      .filter((entry) => entry && typeof entry === 'object' && entry.appId)
      .map((entry) => entry.appId);
    const uniqueEntryIds = new Set(entryIds);
    if (uniqueEntryIds.size !== entryIds.length) {
      errors.push(`${comp.id}: duplicate appId in entries`);
    }
  }

  return errors;
}

export function buildVersusRegistry(competitions, appsById) {
  return competitions.map((comp) => ({
    id: comp.id,
    title: comp.title,
    prompt: comp.prompt,
    createdAt: comp.createdAt,
    category: comp.category,
    entries: comp.entries.map((entry) => {
      const app = appsById.get(entry.appId);
      return {
        appId: entry.appId,
        name: app.name,
        shortDescription: app.shortDescription,
        thumbnailUrl: app.thumbnailUrl,
        appPath: app.appPath,
        model: app.generation?.llmModel || 'unknown',
        agent: app.generation?.agentName || 'unknown',
        generationTime:
          app.generation?.startTime && app.generation?.endTime
            ? Math.round(
                (new Date(app.generation.endTime) - new Date(app.generation.startTime)) / 1000
              )
            : null,
        tokensIn: app.generation?.totalTokensIn || null,
        tokensOut: app.generation?.totalTokensOut || null,
      };
    }),
  }));
}
