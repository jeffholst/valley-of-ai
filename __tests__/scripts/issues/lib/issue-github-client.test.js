import { inferIssueType } from '../../../../scripts/issues/lib/issue-github-client.mjs';

describe('inferIssueType', () => {
  describe('single type labels', () => {
    it('returns suggestion when only suggestion label is present', () => {
      expect(inferIssueType({ labels: [{ name: 'status:pending' }, { name: 'suggestion' }] })).toBe(
        'suggestion'
      );
    });

    it('returns improvement when only improvement label is present', () => {
      expect(
        inferIssueType({ labels: [{ name: 'status:pending' }, { name: 'improvement' }] })
      ).toBe('improvement');
    });

    it('returns blog-post when only blog-post label is present', () => {
      expect(inferIssueType({ labels: [{ name: 'status:pending' }, { name: 'blog-post' }] })).toBe(
        'blog-post'
      );
    });

    it('accepts string labels as well as object labels', () => {
      expect(inferIssueType({ labels: ['status:pending', 'blog-post'] })).toBe('blog-post');
      expect(inferIssueType({ labels: ['suggestion'] })).toBe('suggestion');
      expect(inferIssueType({ labels: ['improvement'] })).toBe('improvement');
    });
  });

  describe('multiple type labels returns null', () => {
    it('returns null when blog-post and suggestion are both present', () => {
      expect(
        inferIssueType({
          labels: [{ name: 'status:pending' }, { name: 'blog-post' }, { name: 'suggestion' }],
        })
      ).toBeNull();
    });

    it('returns null when blog-post and improvement are both present', () => {
      expect(
        inferIssueType({
          labels: [{ name: 'status:pending' }, { name: 'blog-post' }, { name: 'improvement' }],
        })
      ).toBeNull();
    });

    it('returns null when suggestion and improvement are both present', () => {
      expect(
        inferIssueType({
          labels: [{ name: 'suggestion' }, { name: 'improvement' }],
        })
      ).toBeNull();
    });

    it('returns null when all three type labels are present', () => {
      expect(
        inferIssueType({
          labels: [{ name: 'suggestion' }, { name: 'improvement' }, { name: 'blog-post' }],
        })
      ).toBeNull();
    });
  });

  describe('no type labels returns null', () => {
    it('returns null when no type label is present', () => {
      expect(inferIssueType({ labels: [{ name: 'status:pending' }] })).toBeNull();
    });

    it('returns null when labels array is empty', () => {
      expect(inferIssueType({ labels: [] })).toBeNull();
    });

    it('returns null when labels is undefined', () => {
      expect(inferIssueType({})).toBeNull();
    });
  });
});
