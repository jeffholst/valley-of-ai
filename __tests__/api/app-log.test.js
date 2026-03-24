/**
 * @jest-environment node
 */
import { GET } from '@/app/api/app-log/route';

// Mock fs so tests don't touch the real filesystem
jest.mock('fs');
import fs from 'fs';

function makeRequest(appId) {
  const url =
    appId !== undefined
      ? `http://localhost/api/app-log?appId=${encodeURIComponent(appId)}`
      : 'http://localhost/api/app-log';
  return new Request(url);
}

describe('GET /api/app-log', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: directories exist but no log file found
    fs.existsSync.mockReturnValue(false);
    fs.readdirSync.mockReturnValue([]);
    fs.statSync.mockReturnValue({ isDirectory: () => true });
  });

  describe('input validation', () => {
    it('returns 400 when appId is missing', async () => {
      const res = await GET(makeRequest(undefined));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('appId is required');
    });

    it('returns 400 for path traversal attempt with ../', async () => {
      const res = await GET(makeRequest('../../etc/passwd'));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid appId format');
    });

    it('returns 400 for path traversal with encoded characters', async () => {
      const res = await GET(makeRequest('2026/03/24/../../etc/passwd'));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid appId format');
    });

    it('returns 400 for appId with uppercase letters', async () => {
      const res = await GET(makeRequest('2026/03/24/My-App'));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid appId format');
    });

    it('returns 400 for appId missing the date segments', async () => {
      const res = await GET(makeRequest('my-app'));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid appId format');
    });

    it('returns 400 for appId with too many segments', async () => {
      const res = await GET(makeRequest('2026/03/24/my-app/extra'));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid appId format');
    });

    it('returns 400 for appId with special characters in slug', async () => {
      const res = await GET(makeRequest('2026/03/24/my_app'));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid appId format');
    });
  });

  describe('valid appId', () => {
    it('accepts a well-formed appId', async () => {
      // existsSync returns false → log file not found → 404, not 400
      const res = await GET(makeRequest('2026/03/24/my-app'));
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('Log file not found');
    });

    it('returns parsed log entries when log file exists', async () => {
      const logContent = [
        JSON.stringify({ type: 'TRANSACTION_START', runId: 'run-abc' }),
        JSON.stringify({ type: 'STEP', seq: 1, step: 'SELECT_IMPROVEMENT' }),
        '', // blank line — should be filtered out
      ].join('\n');

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(logContent);

      const res = await GET(makeRequest('2026/03/24/my-app'));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(2);
      expect(body[0].type).toBe('TRANSACTION_START');
      expect(body[1].seq).toBe(1);
    });
  });
});
