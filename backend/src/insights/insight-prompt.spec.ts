import { buildInsightMessages, pickInsightFiles } from './insight-prompt.js';

const file = (path: string, size = 10) => ({ path, content: 'x'.repeat(size) });
const files = [
  file('src/utils/strings.ts'),
  file('src/routes/users.ts'),
  file('package.json'),
  file('README.md'),
  file('src/main.ts'),
  file('test/users.spec.ts'),
];

describe('pickInsightFiles', () => {
  it('sends the files that explain the project first', () => {
    expect(pickInsightFiles('ARCHITECTURE', files).map((f) => f.path)).toEqual([
      'README.md',
      'package.json',
      'src/main.ts',
      'src/routes/users.ts',
      'src/utils/strings.ts',
      'test/users.spec.ts',
    ]);
  });

  it('puts route files first for API docs and respects the budget', () => {
    const picked = pickInsightFiles('API_DOCS', files, 25).map((f) => f.path);
    expect(picked).toEqual(['src/routes/users.ts', 'README.md']);
  });
});

describe('buildInsightMessages', () => {
  it('names the task and lists every path', () => {
    const [system, user] = buildInsightMessages({
      kind: 'API_DOCS',
      projectName: 'Shop',
      allPaths: ['a.ts', 'b.ts'],
      files: [{ path: 'a.ts', content: 'app.get("/x")' }],
    });
    expect(system.content).toContain('API documentation');
    expect(system.content).toContain('not found in the code');
    expect(user.content).toContain('b.ts');
    expect(user.content).toContain('=== FILE: a.ts ===');
  });
});
