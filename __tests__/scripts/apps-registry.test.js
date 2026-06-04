import os from 'os';
import path from 'path';
import { transformMeta } from '../../scripts/apps-registry.mjs';

describe('transformMeta leaderboard projection', () => {
  const appsDir = path.join(os.tmpdir(), 'apps');
  const filePath = path.join(os.tmpdir(), 'apps', '2026', '04', '23', 'example-app', 'meta.json');
  const dateInfo = { year: 2026, month: 4, day: 23 };

  it('defaults leaderboard to false when missing', () => {
    const result = transformMeta(
      appsDir,
      {
        name: 'Example',
        shortDescription: 'Example app',
        thumbnail: 'thumbnail.svg',
        createdAt: '2026-04-23T00:00:00Z',
        category: 'Games',
        homepagePath: 'index.html',
      },
      filePath,
      dateInfo
    );

    expect(result.leaderboard).toBe(false);
  });

  it('preserves leaderboard=true from meta', () => {
    const result = transformMeta(
      appsDir,
      {
        name: 'Example',
        shortDescription: 'Example app',
        thumbnail: 'thumbnail.svg',
        createdAt: '2026-04-23T00:00:00Z',
        category: 'Games',
        homepagePath: 'index.html',
        leaderboard: true,
      },
      filePath,
      dateInfo
    );

    expect(result.leaderboard).toBe(true);
  });
});
