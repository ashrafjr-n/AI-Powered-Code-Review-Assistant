import { strToU8, zipSync } from 'fflate';
import { extractZip, InvalidZipError } from './unzip.js';

describe('extractZip', () => {
  it('keeps text files, skips junk folders, lock files and binaries', () => {
    const zip = zipSync({
      'shop-main/src/app.ts': strToU8('export const a = 1;'),
      'shop-main/README.md': strToU8('# Shop'),
      'shop-main/node_modules/x/index.js': strToU8('junk'),
      'shop-main/package-lock.json': strToU8('{}'),
      'shop-main/.vite/deps/react.js': strToU8('cache'),
      'shop-main/dist-lib/app.min.js': strToU8('x'),
      'shop-main/src/app.js.map': strToU8('{}'),
      'shop-main/logo.png': new Uint8Array([137, 80, 78, 71, 0, 1]),
    });
    // The shared "shop-main/" folder is removed.
    expect(extractZip(zip)).toEqual({
      files: [
        { path: 'README.md', content: '# Shop', size: 6, sensitive: false },
        {
          path: 'src/app.ts',
          content: 'export const a = 1;',
          size: 19,
          sensitive: false,
        },
      ],
      skipped: { ignored: 5, binary: 1, tooLarge: 0 },
      redacted: 0,
    });
  });

  it('rejects paths that try to leave the project', () => {
    const zip = zipSync({
      '../evil.ts': strToU8('x'),
      'ok.ts': strToU8('y'),
    });
    expect(extractZip(zip).files.map((file) => file.path)).toEqual(['ok.ts']);
  });

  it('throws a friendly error for broken or empty archives', () => {
    expect(() => extractZip(strToU8('not a zip'))).toThrow(InvalidZipError);
    expect(() => extractZip(zipSync({ 'a.png': new Uint8Array([0]) }))).toThrow(
      'No readable source files',
    );
  });

  it('keeps sensitive files by path only and redacts secrets in code', () => {
    const zip = zipSync({
      '.env': strToU8('OPENROUTER_KEY=sk-or-v1-0123456789abcdef0123456789'),
      '.env.example': strToU8('OPENROUTER_KEY='),
      'src/pay.ts': strToU8('const key = "sk_live_51HxQz8ExampleSecretKey";'),
    });
    const { files, redacted } = extractZip(zip);
    expect(files).toEqual([
      { path: '.env', content: '', size: 50, sensitive: true },
      {
        path: '.env.example',
        content: 'OPENROUTER_KEY=',
        size: 15,
        sensitive: false,
      },
      {
        path: 'src/pay.ts',
        content: 'const key = "‹redacted›";',
        size: 29,
        sensitive: false,
      },
    ]);
    expect(redacted).toBe(1);
  });
});
