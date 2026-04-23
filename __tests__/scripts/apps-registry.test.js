import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  detectLeaderboardUsageFromAppDir,
  detectLeaderboardUsageFromHtml,
  transformMeta,
} from '../../scripts/apps-registry.mjs';

describe('apps-registry leaderboard detection', () => {
  it('detects shared leaderboard submission usage', () => {
    const html = `
      <script>
        if (window.voaLeaderboard) {
          window.voaLeaderboard.submit(score);
        }
      </script>
    `;
    expect(detectLeaderboardUsageFromHtml(html)).toBe(true);
  });

  it('detects manual score submission via fetch', () => {
    const html = `
      <script>
        await fetch('/api/scores', {
          method: 'POST',
          headers: { 'content-type': 'application/json' }
        });
      </script>
    `;
    expect(detectLeaderboardUsageFromHtml(html)).toBe(true);
  });

  it('detects manual score submission via XMLHttpRequest', () => {
    const html = `
      <script>
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/scores');
      </script>
    `;
    expect(detectLeaderboardUsageFromHtml(html)).toBe(true);
  });

  it('does not match plain leaderboard text', () => {
    const html = '<section><h2>Final leaderboard</h2></section>';
    expect(detectLeaderboardUsageFromHtml(html)).toBe(false);
  });

  it('ignores usage strings that only appear in comments', () => {
    const html = `
      <!-- window.voaLeaderboard.submit(score) -->
      <script>
        // fetch('/api/scores', { method: 'POST' });
        /*
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/scores');
        */
      </script>
    `;
    expect(detectLeaderboardUsageFromHtml(html)).toBe(false);
  });

  it('ignores usage strings that only appear in inline comments', () => {
    const html = `
      <script>
        doSomething(); // fetch('/api/scores', { method: 'POST' });
        doOther(); // window.voaLeaderboard.submit(score);
      </script>
    `;
    expect(detectLeaderboardUsageFromHtml(html)).toBe(false);
  });

  it('still detects usage when it appears after an unrelated inline comment', () => {
    const html = `
      <script>
        doSomething(); // just a regular comment
        window.voaLeaderboard.submit(score);
      </script>
    `;
    expect(detectLeaderboardUsageFromHtml(html)).toBe(true);
  });

  it('detects usage from app directory index.html', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'voa-leaderboard-'));
    try {
      fs.writeFileSync(
        path.join(dir, 'index.html'),
        '<script>window.voaLeaderboard.submit(42);</script>',
        'utf8'
      );
      expect(detectLeaderboardUsageFromAppDir(dir)).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

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
