import {
  extractJson,
  highestSeverity,
  parseReviewOutput,
} from './review-output.js';

const files = [
  { path: 'src/app.ts', content: 'a\nb\nc' },
  { path: 'src/db/pool.ts', content: 'x' },
];

describe('parseReviewOutput', () => {
  it('accepts fenced JSON, fixes casing, sorts by severity and keeps real paths only', () => {
    const text = [
      'Here is the review:',
      '```json',
      JSON.stringify({
        summary: ' Two problems. ',
        issues: [
          {
            title: 'Slow',
            description: 'd',
            severity: 'low',
            filePath: './src/app.ts',
            line: '2',
          },
          {
            title: 'Key',
            description: 'd',
            severity: 'Critical',
            filePath: 'pool.ts',
            line: 1,
          },
          {
            title: 'Ghost',
            description: 'd',
            severity: 'HIGH',
            filePath: 'nope.ts',
            line: 3,
          },
          {
            title: 'Far',
            description: 'd',
            severity: 'MEDIUM',
            filePath: 'src/app.ts',
            line: 99,
          },
        ],
        recommendations: ['Fix it'],
      }),
      '```',
    ].join('\n');

    expect(parseReviewOutput(text, files)).toEqual({
      summary: 'Two problems.',
      issues: [
        {
          title: 'Key',
          description: 'd',
          severity: 'CRITICAL',
          filePath: 'src/db/pool.ts',
          line: 1,
        },
        { title: 'Ghost', description: 'd', severity: 'HIGH' },
        {
          title: 'Far',
          description: 'd',
          severity: 'MEDIUM',
          filePath: 'src/app.ts',
        },
        {
          title: 'Slow',
          description: 'd',
          severity: 'LOW',
          filePath: 'src/app.ts',
          line: 2,
        },
      ],
      recommendations: ['Fix it'],
    });
  });

  it('fills defaults for a clean review', () => {
    expect(parseReviewOutput('{"summary":"All good."}', files)).toEqual({
      summary: 'All good.',
      issues: [],
      recommendations: [],
    });
  });

  it('throws a short reason for invalid output', () => {
    expect(() => extractJson('no json here')).toThrow('No JSON');
    expect(() =>
      parseReviewOutput(
        '{"summary":"x","issues":[{"title":"t","severity":"urgent"}]}',
        files,
      ),
    ).toThrow(/severity/);
  });

  it('finds the highest severity', () => {
    expect(highestSeverity([])).toBeNull();
    expect(
      highestSeverity([
        { title: 't', description: '', severity: 'LOW' },
        { title: 't', description: '', severity: 'HIGH' },
      ]),
    ).toBe('HIGH');
  });
});
