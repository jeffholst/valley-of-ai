/**
 * Site Configuration Tests
 */

import {
  siteName,
  socialXUrl,
  socialFacebookUrl,
  socialInstagramUrl,
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
