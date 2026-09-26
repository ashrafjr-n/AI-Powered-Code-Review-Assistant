import { buildChatMessages } from './chat-prompt.js';
import { keywords, rankFiles } from './retrieval.js';

const files = [
  {
    path: 'src/auth/login.ts',
    content: 'export function login() { checkPassword(); }',
  },
  {
    path: 'src/db/pool.ts',
    content: 'const pool = new Pool(); // database connection',
  },
  {
    path: 'src/middleware/errors.ts',
    content: 'function onError(error) { log(error); }',
  },
  { path: 'README.md', content: 'Login and database setup.' },
];

describe('keywords', () => {
  it('drops stop words and plurals', () => {
    expect(keywords('Where are errors handled in this project?')).toEqual([
      'error',
      'handled',
    ]);
  });
});

describe('rankFiles', () => {
  it('ranks files whose path matches first, then content hits', () => {
    expect(
      rankFiles('Which file handles the database connection?', files),
    ).toEqual(['src/db/pool.ts', 'README.md']);
    expect(rankFiles('How does login work?', files)[0]).toBe(
      'src/auth/login.ts',
    );
    expect(rankFiles('Where are errors handled?', files)).toEqual([
      'src/middleware/errors.ts',
    ]);
  });

  it('returns nothing when no word matches', () => {
    expect(rankFiles('what is this?', files)).toEqual([]);
    expect(rankFiles('kubernetes helm chart', files)).toEqual([]);
  });
});

describe('buildChatMessages', () => {
  it('puts files in the system message and keeps the history order', () => {
    const messages = buildChatMessages({
      projectName: 'Shop',
      allPaths: ['a.ts', 'b.ts'],
      sources: [{ path: 'a.ts', content: 'const a = 1;' }],
      history: [
        { role: 'USER', content: 'first?' },
        { role: 'ASSISTANT', content: 'first answer' },
      ],
      question: 'second?',
    });
    expect(messages.map((m) => m.role)).toEqual([
      'system',
      'user',
      'assistant',
      'user',
    ]);
    expect(messages[0].content).toContain('=== FILE: a.ts ===');
    expect(messages[0].content).toContain('b.ts');
    expect(messages[3].content).toBe('second?');
  });
});
