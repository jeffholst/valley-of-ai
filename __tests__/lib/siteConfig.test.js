/**
 * Site Configuration Tests
 */

describe('siteConfig', () => {
  let siteConfig;

  beforeEach(async () => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_SITE_NAME = 'Valley of AI';
    process.env.NEXT_PUBLIC_SOCIAL_X_URL = 'https://x.com/valleyofai';
    process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL = 'https://facebook.com/valleyofai';
    process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL = 'https://instagram.com/valleyofai';
    process.env.NEXT_PUBLIC_GITHUB_URL = 'https://github.com/jeffholst/valley-of-ai';
    siteConfig = await import('@/lib/siteConfig');
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_NAME;
    delete process.env.NEXT_PUBLIC_SOCIAL_X_URL;
    delete process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK_URL;
    delete process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL;
    delete process.env.NEXT_PUBLIC_GITHUB_URL;
  });

  it('exports site name', () => {
    const { siteName } = siteConfig;
    expect(siteName).toBeDefined();
    expect(typeof siteName).toBe('string');
    expect(siteName.length).toBeGreaterThan(0);
  });

  it('exports social URLs', () => {
    const { socialXUrl, socialFacebookUrl, socialInstagramUrl } = siteConfig;
    expect(socialXUrl).toBeDefined();
    expect(socialFacebookUrl).toBeDefined();
    expect(socialInstagramUrl).toBeDefined();
  });

  it('social URLs are valid URLs', () => {
    const { socialXUrl, socialFacebookUrl, socialInstagramUrl } = siteConfig;
    const urlRegex = /^https?:\/\/\S+/;
    expect(socialXUrl).toMatch(urlRegex);
    expect(socialFacebookUrl).toMatch(urlRegex);
    expect(socialInstagramUrl).toMatch(urlRegex);
  });

  it('exports GitHub URL', () => {
    const { githubUrl } = siteConfig;
    expect(githubUrl).toBeDefined();
    expect(typeof githubUrl).toBe('string');
  });

  it('GitHub URL is a valid URL format', () => {
    const { githubUrl } = siteConfig;
    const urlRegex = /^https?:\/\/\S+/;
    expect(githubUrl).toMatch(urlRegex);
  });

  it('GitHub URL contains expected domain', () => {
    const { githubUrl } = siteConfig;
    expect(githubUrl).toContain('github.com');
  });

  it('X URL contains expected domain', () => {
    const { socialXUrl } = siteConfig;
    expect(socialXUrl).toContain('x.com');
  });

  it('Facebook URL contains expected domain', () => {
    const { socialFacebookUrl } = siteConfig;
    expect(socialFacebookUrl).toContain('facebook.com');
  });

  it('Instagram URL contains expected domain', () => {
    const { socialInstagramUrl } = siteConfig;
    expect(socialInstagramUrl).toContain('instagram.com');
  });
});
