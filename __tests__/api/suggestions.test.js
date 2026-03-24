/**
 * @jest-environment node
 */
import { POST } from '@/app/api/suggestions/route';

const VALID_BODY = {
  turnstileToken: 'tok',
  category: 'Games',
  requestor: 'Alice',
  description: 'A fun game where you shoot asteroids in space.',
};

function makeRequest(body) {
  return new Request('http://localhost/api/suggestions', {
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

function mockGitHubOk(issueNumber = 99) {
  global.fetch.mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        number: issueNumber,
        html_url: `https://github.com/owner/repo/issues/${issueNumber}`,
      }),
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

describe('POST /api/suggestions', () => {
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
      const req = new Request('http://localhost/api/suggestions', {
        method: 'POST',
        body: 'not-json',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when category is missing', async () => {
      const { category: _c, ...body } = VALID_BODY;
      const res = await POST(makeRequest(body));
      expect(res.status).toBe(400);
    });

    it('returns 400 when description is missing', async () => {
      const { description: _d, ...body } = VALID_BODY;
      const res = await POST(makeRequest(body));
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
      const body = await res.json();
      expect(body.error).toMatch(/1000/);
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
      const body = await res.json();
      expect(body.error).toBe('Bot verification failed');
    });

    it('returns 403 when Turnstile endpoint returns HTTP error', async () => {
      global.fetch.mockResolvedValueOnce(new Response('error', { status: 500 }));
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(403);
    });
  });

  describe('GitHub API', () => {
    it('returns 502 when GitHub API returns an error', async () => {
      mockTurnstileOk();
      global.fetch.mockResolvedValueOnce(new Response('Not Found', { status: 404 }));
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(502);
    });

    it('creates issue and returns 201 on success', async () => {
      mockTurnstileOk();
      mockGitHubOk(42);
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.issueNumber).toBe(42);
      expect(body.issueUrl).toContain('/issues/42');
    });

    it('sends correct labels and category in GitHub issue body', async () => {
      mockTurnstileOk();
      mockGitHubOk();
      await POST(makeRequest(VALID_BODY));
      const [, githubCall] = global.fetch.mock.calls;
      const payload = JSON.parse(githubCall[1].body);
      expect(payload.labels).toContain('suggestion');
      expect(payload.body).toContain('Games');
    });

    it('uses "anonymous" when requestor is omitted', async () => {
      const { requestor: _r, ...body } = VALID_BODY;
      mockTurnstileOk();
      mockGitHubOk();
      await POST(makeRequest(body));
      const [, githubCall] = global.fetch.mock.calls;
      const payload = JSON.parse(githubCall[1].body);
      expect(payload.body).toContain('anonymous');
    });
  });
});
