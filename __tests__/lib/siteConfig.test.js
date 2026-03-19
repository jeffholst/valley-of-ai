/**
 * Site Configuration Tests
 */

import {
  siteName,
  socialXUrl,
  socialFacebookUrl,
  socialInstagramUrl,
  githubUrl,
} from '@/lib/siteConfig';

describe('siteConfig', () => {
  it('exports site name', () => {
    expect(siteName).toBeDefined();
    expect(typeof siteName).toBe('string');
    expect(siteName.length).toBeGreaterThan(0);
  });

  it('exports social URLs', () => {
    expect(socialXUrl).toBeDefined();
    expect(socialFacebookUrl).toBeDefined();
    expect(socialInstagramUrl).toBeDefined();
  });

  it('social URLs are valid URLs', () => {
    const urlRegex = /^https?:\/\/\S+/;
    expect(socialXUrl).toMatch(urlRegex);
    expect(socialFacebookUrl).toMatch(urlRegex);
    expect(socialInstagramUrl).toMatch(urlRegex);
  });

  it('exports GitHub URL', () => {
    expect(githubUrl).toBeDefined();
    expect(typeof githubUrl).toBe('string');
  });

  it('GitHub URL is a valid URL format', () => {
    const urlRegex = /^https?:\/\/\S+/;
    expect(githubUrl).toMatch(urlRegex);
  });

  it('GitHub URL contains expected domain', () => {
    expect(githubUrl).toContain('github.com');
  });

  it('X URL contains expected domain', () => {
    expect(socialXUrl).toContain('x.com');
  });

  it('Facebook URL contains expected domain', () => {
    expect(socialFacebookUrl).toContain('facebook.com');
  });

  it('Instagram URL contains expected domain', () => {
    expect(socialInstagramUrl).toContain('instagram.com');
  });
});
