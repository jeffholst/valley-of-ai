/**
 * Tests for the validateShortSlug helper exported from scripts/validate-posts.mjs.
 */

import { validateShortSlug } from '../../scripts/post-validators.mjs';

// ---------------------------------------------------------------------------
// validateShortSlug
// ---------------------------------------------------------------------------

describe('validateShortSlug', () => {
  function sets(...fullSlugs) {
    return [new Set(fullSlugs), new Set()];
  }

  describe('valid values', () => {
    it('accepts a simple lowercase word', () => {
      const [full, short] = sets();
      expect(validateShortSlug('versus', full, short)).toBeNull();
    });

    it('accepts lowercase with hyphens', () => {
      const [full, short] = sets();
      expect(validateShortSlug('my-post', full, short)).toBeNull();
    });

    it('accepts lowercase with numbers', () => {
      const [full, short] = sets();
      expect(validateShortSlug('post2', full, short)).toBeNull();
    });

    it('accepts alphanumeric with hyphens', () => {
      const [full, short] = sets();
      expect(validateShortSlug('post-2026', full, short)).toBeNull();
    });

    it('adds the shortSlug to the seenShortSlugs set on success', () => {
      const seenShortSlugs = new Set();
      validateShortSlug('versus', new Set(), seenShortSlugs);
      expect(seenShortSlugs.has('versus')).toBe(true);
    });
  });

  describe('format validation', () => {
    it('rejects uppercase letters', () => {
      const [full, short] = sets();
      expect(validateShortSlug('Versus', full, short)).toMatch(/lowercase/);
    });

    it('rejects spaces', () => {
      const [full, short] = sets();
      expect(validateShortSlug('my post', full, short)).toMatch(/lowercase/);
    });

    it('rejects underscores', () => {
      const [full, short] = sets();
      expect(validateShortSlug('my_post', full, short)).toMatch(/lowercase/);
    });

    it('rejects special characters', () => {
      const [full, short] = sets();
      expect(validateShortSlug('post!', full, short)).toMatch(/lowercase/);
    });

    it('rejects an empty string', () => {
      const [full, short] = sets();
      expect(validateShortSlug('', full, short)).toMatch(/lowercase/);
    });

    it('does not add an invalid value to seenShortSlugs', () => {
      const seenShortSlugs = new Set();
      validateShortSlug('BAD VALUE', new Set(), seenShortSlugs);
      expect(seenShortSlugs.size).toBe(0);
    });
  });

  describe('duplicate shortSlug', () => {
    it('rejects a shortSlug already in seenShortSlugs', () => {
      const seenShortSlugs = new Set(['versus']);
      expect(validateShortSlug('versus', new Set(), seenShortSlugs)).toMatch(/duplicate/);
    });

    it('does not mutate seenShortSlugs on duplicate', () => {
      const seenShortSlugs = new Set(['versus']);
      validateShortSlug('versus', new Set(), seenShortSlugs);
      expect(seenShortSlugs.size).toBe(1);
    });
  });

  describe('collision with full slug', () => {
    it('rejects a shortSlug that matches a full slug', () => {
      const [, short] = sets();
      const fullSlugs = new Set(['blog-post-introducing-versus-making-models-compete', 'pipeline']);
      expect(validateShortSlug('pipeline', fullSlugs, short)).toMatch(/collides/);
    });

    it('does not add a colliding value to seenShortSlugs', () => {
      const seenShortSlugs = new Set();
      validateShortSlug('pipeline', new Set(['pipeline']), seenShortSlugs);
      expect(seenShortSlugs.size).toBe(0);
    });

    it('accepts a shortSlug not present in full slugs', () => {
      const fullSlugs = new Set(['blog-post-introducing-versus-making-models-compete']);
      const seenShortSlugs = new Set();
      expect(validateShortSlug('versus', fullSlugs, seenShortSlugs)).toBeNull();
    });
  });

  describe('precedence', () => {
    it('reports format error before duplicate check', () => {
      const seenShortSlugs = new Set(['BAD VALUE']);
      const result = validateShortSlug('BAD VALUE', new Set(), seenShortSlugs);
      expect(result).toMatch(/lowercase/);
    });

    it('reports format error before collision check', () => {
      const result = validateShortSlug('BAD!', new Set(['BAD!']), new Set());
      expect(result).toMatch(/lowercase/);
    });
  });
});
