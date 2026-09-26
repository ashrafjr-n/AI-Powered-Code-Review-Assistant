import { strToU8, zipSync } from 'fflate';
import { extractZip, InvalidZipError } from './unzip.js';

describe('extractZip', () => {
  it('keeps text files, skips junk folders, lock files and binaries', () => {
    const zip = zipSync({
      'shop-main/src/app.ts': strToU8('export const a = 1;'),
      'shop-main/README.md': strToU8('# Shop'),
      'shop-main/node_modules/x/index.js': strToU8('junk'),
      'shop-main/package-lock.json': strToU8('{}'),
      'shop-main/logo.png': new Uint8Array([137, 80, 78, 71, 0, 1]),
    });
    // The shared "shop-main/" folder is removed.
    expect(extractZip(zip)).toEqual([
      { path: 'README.md', content: '# Shop', size: 6 },
      { path: 'src/app.ts', content: 'export const a = 1;', size: 19 },
    ]);
  });

  it('rejects paths that try to leave the project', () => {
    const zip = zipSync({
      '../evil.ts': strToU8('x'),
      'ok.ts': strToU8('y'),
    });
    expect(extractZip(zip).map((file) => file.path)).toEqual(['ok.ts']);
  });

  it('throws a friendly error for broken or empty archives', () => {
    expect(() => extractZip(strToU8('not a zip'))).toThrow(InvalidZipError);
    expect(() => extractZip(zipSync({ 'a.png': new Uint8Array([0]) }))).toThrow(
      'No readable source files',
    );
  });
});
