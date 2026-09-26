import { diffFiles, resolveTypedPath } from './review-diff.js';

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

describe('resolveTypedPath', () => {
  const paths = ['src/auth.ts', 'src/db.ts', 'api/db.ts'];

  it('accepts the full path or a unique file name', () => {
    expect(resolveTypedPath('src/auth.ts', paths)).toEqual({
      path: 'src/auth.ts',
    });
    expect(resolveTypedPath(' ./auth.ts ', paths)).toEqual({
      path: 'src/auth.ts',
    });
    expect(resolveTypedPath('src/db.ts', paths)).toEqual({ path: 'src/db.ts' });
  });

  it('explains unknown and ambiguous names', () => {
    expect(resolveTypedPath('nope.ts', paths)).toEqual({
      error: 'No file called "nope.ts" in this project.',
    });
    expect(resolveTypedPath('db.ts', paths)).toEqual({
      error:
        '"db.ts" matches 2 files. Type more of the path, for example src/db.ts.',
    });
    // Only whole path parts count: "th.ts" is not "auth.ts".
    expect(resolveTypedPath('th.ts', paths)).toHaveProperty('error');
  });
});
