import { inferIssueType } from '../../../../scripts/issues/lib/issue-github-client.mjs';

describe('inferIssueType', () => {
  it('returns blog-post when the blog-post label is present by itself', () => {
    expect(inferIssueType({ labels: [{ name: 'status:pending' }, { name: 'blog-post' }] })).toBe(
      'blog-post'
    );
  });

  it('returns null when more than one type label is present', () => {
    expect(
      inferIssueType({
        labels: [{ name: 'status:pending' }, { name: 'blog-post' }, { name: 'suggestion' }],
      })
    ).toBeNull();
  });
});
