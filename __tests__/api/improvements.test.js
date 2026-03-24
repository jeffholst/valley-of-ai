/**
 * @jest-environment node
 */
import { POST } from '@/app/api/improvements/route';

const VALID_BODY = {
  turnstileToken: 'tok',
  appId: '2026/03/24/my-app',
  appName: 'My App',
  requestor: 'Bob',
  description: 'Add a dark mode toggle to the settings panel.',
};

function makeRequest(body) {
  return new Request('http://localhost/api/improvements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockTurnstileOk() {
  global.fetch.mockResolvedValueOnce(
    new Response(JSON.stringify({ success: true }), { status: 200 })
  );
}

function mockGitHubOk(issueNumber = 55) {
  global.fetch.mockResolvedValueOnce(
    new Response(
      JSON.stringify({ number: issueNumber, html_url: `https://github.com/owner/repo/issues/${issueNumber}` }),
      { status: 201 }
    )
  );
}

beforeEach(() => {
  process.env.GITHUB_SUGGESTIONS_TOKEN = 'test-token';
  process.env.GITHUB_REPO = 'owner/repo';
  process.env.TURNSTILE_SECRET_KEY = 'test-key';
  global.fetch = jest.fn();
});

afterEach(() => {
  delete process.env.GITHUB_SUGGESTIONS_TOKEN;
  delete process.env.GITHUB_REPO;
  delete process.env.TURNSTILE_SECRET_KEY;
  jest.clearAllMocks();
});

describe('POST /api/improvements', () => {
  describe('env guard', () => {
    it('returns 503 when GITHUB_SUGGESTIONS_TOKEN is missing', async () => {
      delete process.env.GITHUB_SUGGESTIONS_TOKEN;
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(503);
    });

    it('returns 503 when GITHUB_REPO is missing', async () => {
      delete process.env.GITHUB_REPO;
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(503);
    });
  });

  describe('input validation', () => {
    it('returns 400 for invalid JSON body', async () => {
      const req = new Request('http://localhost/api/improvements', {
        method: 'POST',
        body: 'not-json',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when appId is missing', async () => {
      const { appId: _a, ...body } = VALID_BODY;
      const res = await POST(makeRequest(body));
      expect(res.status).toBe(400);
    });

    it('returns 400 when description is missing', async () => {
      const { description: _d, ...body } = VALID_BODY;
      const res = await POST(makeRequest(body));
      expect(res.status).toBe(400);
    });

    it('returns 400 for appId with path traversal', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, appId: '../../etc/passwd' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid app ID');
    });

    it('returns 400 for appId missing the date prefix', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, appId: 'my-app' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when description is too short', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, description: 'short' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/10/);
    });

    it('returns 400 when description exceeds 1000 characters', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, description: 'x'.repeat(1001) }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when turnstileToken is missing in non-development env', async () => {
      const { turnstileToken: _t, ...body } = VALID_BODY;
      const res = await POST(makeRequest(body));
      expect(res.status).toBe(400);
    });
  });

  describe('Turnstile verification', () => {
    it('returns 403 when Turnstile verification fails', async () => {
      global.fetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: false }), { status: 200 })
      );
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(403);
    });
  });

  describe('escapeMd()', () => {
    it('escapes Markdown metacharacters in appName', async () => {
      mockTurnstileOk();
      mockGitHubOk();
      const maliciousName = '**bold** and [link](http://evil.com)';
      await POST(makeRequest({ ...VALID_BODY, appName: maliciousName }));
      const [, githubCall] = global.fetch.mock.calls;
      const payload = JSON.parse(githubCall[1].body);
      expect(payload.body).not.toContain('**bold**');
      expect(payload.body).not.toContain('[link](');
    });

    it('strips newlines from appName to prevent injection', async () => {
      mockTurnstileOk();
      mockGitHubOk();
      await POST(makeRequest({ ...VALID_BODY, appName: 'Legit\nInjected line' }));
      const [, githubCall] = global.fetch.mock.calls;
      const payload = JSON.parse(githubCall[1].body);
      expect(payload.body).not.toContain('\n\nInjected');
    });
  });

  describe('GitHub API', () => {
    it('returns 502 when GitHub API returns an error', async () => {
      mockTurnstileOk();
      global.fetch.mockResolvedValueOnce(new Response('Forbidden', { status: 403 }));
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(502);
    });

    it('creates issue and returns 201 on success', async () => {
      mockTurnstileOk();
      mockGitHubOk(55);
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.issueNumber).toBe(55);
      expect(body.issueUrl).toContain('/issues/55');
    });

    it('sends improvement label and appId in GitHub issue title', async () => {
      mockTurnstileOk();
      mockGitHubOk();
      await POST(makeRequest(VALID_BODY));
      const [, githubCall] = global.fetch.mock.calls;
      const payload = JSON.parse(githubCall[1].body);
      expect(payload.labels).toContain('improvement');
      expect(payload.title).toContain(VALID_BODY.appId);
    });
  });
});
