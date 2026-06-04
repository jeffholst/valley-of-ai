/**
 * @jest-environment node
 */
import { POST } from '@/app/api/blog-ideas/route';

const VALID_BODY = {
  turnstileToken: 'tok',
  title: 'A great idea for an AI blog post',
  category: 'AI Experiments',
  description: 'This post will explore how LLMs handle creative constraints.',
};

function makeRequest(body) {
  return new Request('http://localhost/api/blog-ideas', {
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

describe('POST /api/blog-ideas', () => {
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
      const req = new Request('http://localhost/api/blog-ideas', {
        method: 'POST',
        body: 'not-json',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when title is missing', async () => {
      const { title: _t, ...body } = VALID_BODY;
      const res = await POST(makeRequest(body));
      expect(res.status).toBe(400);
    });

    it('returns 400 when title is too short', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, title: 'Short' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/10/);
    });

    it('returns 400 when title is too long', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, title: 'A'.repeat(201) }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/200/);
    });

    it('returns 400 when category is missing', async () => {
      const { category: _c, ...body } = VALID_BODY;
      const res = await POST(makeRequest(body));
      expect(res.status).toBe(400);
    });

    it('returns 400 when category is not in the valid set', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, category: 'Made Up Category' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/[Ii]nvalid category/);
    });

    it('returns 400 when description is missing', async () => {
      const { description: _d, ...body } = VALID_BODY;
      const res = await POST(makeRequest(body));
      expect(res.status).toBe(400);
    });

    it('returns 400 when description is too short', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, description: 'Too short.' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/20/);
    });

    it('returns 400 when description is too long', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, description: 'x'.repeat(1001) }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/1000/);
    });

    it('returns 400 when authorType is present but invalid', async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, authorType: 'robot' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/[Ii]nvalid author/);
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
      mockGitHubOk(77);
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.issueNumber).toBe(77);
      expect(body.issueUrl).toContain('/issues/77');
    });

    it('sends blog-post and status:pending labels', async () => {
      mockTurnstileOk();
      mockGitHubOk();
      await POST(makeRequest(VALID_BODY));
      const [, githubCall] = global.fetch.mock.calls;
      const payload = JSON.parse(githubCall[1].body);
      expect(payload.labels).toContain('blog-post');
      expect(payload.labels).toContain('status:pending');
    });

    it('includes category and description in issue body', async () => {
      mockTurnstileOk();
      mockGitHubOk();
      await POST(makeRequest(VALID_BODY));
      const [, githubCall] = global.fetch.mock.calls;
      const payload = JSON.parse(githubCall[1].body);
      expect(payload.body).toContain('AI Experiments');
      // escapeMd escapes special chars, so check a punctuation-free substring
      expect(payload.body).toContain('This post will explore how LLMs handle creative');
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

    it('accepts all valid categories', async () => {
      const validCategories = [
        'Build Logs',
        'AI Experiments',
        'App Spotlights',
        'Human Notes',
        'Bot Notes',
        'Tutorials',
        'Release Notes',
      ];
      for (const category of validCategories) {
        mockTurnstileOk();
        mockGitHubOk();
        const res = await POST(makeRequest({ ...VALID_BODY, category }));
        expect(res.status).toBe(201);
      }
    });

    it('accepts valid authorType values', async () => {
      for (const authorType of ['ai', 'human', 'human+ai']) {
        mockTurnstileOk();
        mockGitHubOk();
        const res = await POST(makeRequest({ ...VALID_BODY, authorType }));
        expect(res.status).toBe(201);
      }
    });
  });
});
