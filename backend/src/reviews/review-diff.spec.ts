import { diffFiles } from './review-diff.js';

describe('diffFiles', () => {
  const before = {
    path: 'src/login.ts',
    content: 'const a = 1;\nif (!user) throw err;\nlogin(user);\n',
  };

  it('numbers kept and added lines with the after file line, not removed ones', () => {
    const after = {
      path: 'src/login.v2.ts',
      content: 'const a = 1;\nlogin(user);\nlog(password);\n',
    };
    const diff = diffFiles(before, after)!;
    expect(diff.numbered.split('\n')).toEqual([
      '…',
      '   1|  const a = 1;',
      '    | -if (!user) throw err;',
      '   2|  login(user);',
      '   3| +log(password);',
    ]);
    expect(diff.patch).toContain(
      '--- src/login.ts\n+++ src/login.v2.ts\n@@ -1,3 +1,3 @@',
    );
  });

  it('returns null for identical files', () => {
    expect(diffFiles(before, { ...before, path: 'copy.ts' })).toBeNull();
  });
});
