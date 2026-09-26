import { buildReviewMessages, pickFiles } from './review-prompt.js';

const file = (path: string, size: number) => ({
  path,
  content: 'x'.repeat(size),
});

describe('pickFiles', () => {
  it('keeps whole files until the budget is full', () => {
    const { included, skipped } = pickFiles(
      [file('a', 40), file('b', 70), file('c', 10)],
      100,
    );
    expect(included.map((f) => f.path)).toEqual(['a', 'c']);
    expect(skipped).toBe(1);
  });

  it('cuts a first file that is bigger than the budget', () => {
    const { included } = pickFiles([file('big', 500)], 100);
    expect(included[0].content).toHaveLength(100);
  });
});

describe('buildReviewMessages', () => {
  it('numbers lines and names the lens', () => {
    const [system, user] = buildReviewMessages('SECURITY', [
      { path: 'src/a.ts', content: 'const a = 1;\nconst b = 2;' },
    ]);
    expect(system.content).toContain('security review');
    expect(user.content).toContain('=== FILE: src/a.ts ===');
    expect(user.content).toContain('   2| const b = 2;');
  });
});
