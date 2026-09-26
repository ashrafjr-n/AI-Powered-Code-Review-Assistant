import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { strToU8, zipSync } from 'fflate';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe('Reviews (e2e)', () => {
  let app: INestApplication<App>;
  let fake: Server;
  let fakeUrl: string;
  // Replies the fake model gives, one per request; the last one repeats.
  let replies: string[] = [];
  const prompts: string[] = [];
  const stamp = Date.now();
  const emails = [
    `rev-a-${stamp}@test.dev`,
    `rev-b-${stamp}@test.dev`,
    `rev-c-${stamp}@test.dev`,
  ];

  const goodReply = JSON.stringify({
    summary: 'A tiny shop with one leaked key.',
    issues: [
      {
        title: 'Minor naming',
        description: 'd',
        severity: 'low',
        filePath: 'src/app.ts',
        line: 1,
      },
      {
        title: 'Hardcoded secret',
        description: 'd',
        severity: 'CRITICAL',
        filePath: 'config.ts',
        line: 1,
      },
    ],
    recommendations: ['Move secrets to env vars.'],
  });

  async function signedIn(email: string) {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Tester' })
      .expect(201);
    return agent;
  }

  beforeAll(async () => {
    // Fake OpenAI-compatible chat completions endpoint.
    fake = createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        prompts.push(body);
        const content = replies.length > 1 ? replies.shift()! : replies[0];
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            id: 'x',
            object: 'chat.completion',
            created: 0,
            model: 'fake',
            choices: [
              {
                index: 0,
                finish_reason: 'stop',
                message: { role: 'assistant', content },
              },
            ],
          }),
        );
      });
    });
    await new Promise<void>((resolve) => fake.listen(0, resolve));
    fakeUrl = `http://127.0.0.1:${(fake.address() as AddressInfo).port}/v1`;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app
      .get(PrismaService)
      .user.deleteMany({ where: { email: { in: emails } } });
    await app.close();
    fake.close();
  });

  it('runs a review with one retry, saves it, and lists/searches it for the owner only', async () => {
    const owner = await signedIn(emails[0]);
    const other = await signedIn(emails[1]);
    const { body: project } = await owner
      .post('/api/projects')
      .send({ name: 'Shop' })
      .expect(201);
    await owner
      .post(`/api/projects/${project.id}/files`)
      .attach(
        'file',
        Buffer.from(
          zipSync({
            'README.md': strToU8('# Shop\n'),
            '.env': strToU8('STRIPE_SECRET=do-not-leak-this-value'),
            'src/app.ts': strToU8('const a = 1;\n'),
            'src/config.ts': strToU8('export const key = "sk_live_123";\n'),
          }),
        ),
        'shop.zip',
      )
      .expect(201);
    const run = `/api/projects/${project.id}/reviews`;

    // No provider yet → clear 400.
    const none = await owner
      .post(run)
      .send({ mode: 'SECURITY', scope: 'PROJECT' })
      .expect(400);
    expect(none.body.message).toContain('Add a model provider');

    await owner
      .post('/api/providers')
      .send({ name: 'Fake', baseUrl: fakeUrl, model: 'fake-coder' })
      .expect(201);

    // Before running: 3 readable files fit, 1 hidden (.env).
    const plan = await owner.get(`${run}/plan`).expect(200);
    expect(plan.body).toEqual({ total: 3, fits: 3, hidden: 1 });

    // First reply is not JSON → the engine asks again and accepts the second.
    replies = ['Sure! Here is my review: it looks fine.', goodReply];
    prompts.length = 0;
    const { body: review } = await owner
      .post(run)
      .send({ mode: 'SECURITY', scope: 'PROJECT' })
      .expect(201);
    expect(prompts).toHaveLength(2);
    expect(prompts[0]).toContain('=== FILE: src/config.ts ===');
    expect(prompts[1]).toContain('That reply was not valid');
    // The .env file is named, never sent.
    expect(prompts[0]).toContain('NOT SENT (privacy)');
    expect(prompts[0]).toContain('.env');
    expect(prompts[0]).not.toContain('do-not-leak-this-value');
    expect(review).toMatchObject({
      mode: 'SECURITY',
      scope: 'PROJECT',
      // Source code first, docs last.
      filePaths: ['src/app.ts', 'src/config.ts', 'README.md'],
      highestSeverity: 'CRITICAL',
      providerName: 'Fake',
      model: 'fake-coder',
      projectName: 'Shop',
      recommendations: ['Move secrets to env vars.'],
    });
    // Sorted worst first; "config.ts" matched to the real path.
    expect(review.issues[0]).toMatchObject({
      severity: 'CRITICAL',
      filePath: 'src/config.ts',
      line: 1,
    });

    // Only real project files are sent; one file → FILE scope.
    replies = [goodReply];
    const single = await owner
      .post(run)
      .send({
        mode: 'QUALITY',
        scope: 'FILES',
        filePaths: ['src/app.ts', '../../etc/passwd'],
      })
      .expect(201);
    expect(single.body).toMatchObject({
      scope: 'FILE',
      filePaths: ['src/app.ts'],
    });
    await owner
      .post(run)
      .send({ mode: 'QUALITY', scope: 'FILE', filePaths: ['nope.ts'] })
      .expect(400);
    await owner.post(run).send({ mode: 'NOPE', scope: 'PROJECT' }).expect(400);

    // Always invalid → 502 with a clear message.
    replies = ['not json'];
    const bad = await owner
      .post(run)
      .send({ mode: 'SECURITY', scope: 'PROJECT' })
      .expect(502);
    expect(bad.body.message).toContain('did not return a valid review');

    // History: filters and search.
    const all = await owner.get('/api/reviews').expect(200);
    expect(all.body).toHaveLength(2);
    expect(
      (await owner.get('/api/reviews').query({ mode: 'QUALITY' })).body,
    ).toHaveLength(1);
    expect(
      (await owner.get('/api/reviews').query({ q: 'hardcoded' })).body,
    ).toHaveLength(2);
    expect(
      (await owner.get('/api/reviews').query({ q: 'config.ts' })).body,
    ).toHaveLength(1);
    expect(
      (await owner.get('/api/reviews').query({ severity: 'LOW' })).body,
    ).toHaveLength(0);
    await owner.get(`/api/reviews/${review.id}`).expect(200);

    // Other users see nothing.
    expect((await other.get('/api/reviews').expect(200)).body).toEqual([]);
    await other.get(`/api/reviews/${review.id}`).expect(404);
    await other
      .post(run)
      .send({ mode: 'SECURITY', scope: 'PROJECT' })
      .expect(404);
  });

  it('reviews only the change between two files (DIFF)', async () => {
    const owner = await signedIn(emails[2]);
    const { body: project } = await owner
      .post('/api/projects')
      .send({ name: 'Login' })
      .expect(201);
    const loginV1 = 'const a = 1;\nif (!user) throw err;\nlogin(user);\n';
    await owner
      .post(`/api/projects/${project.id}/files`)
      .attach(
        'file',
        Buffer.from(
          zipSync({
            'src/login.ts': strToU8(loginV1),
            'src/login.v2.ts': strToU8(
              'const a = 1;\nlogin(user);\nlog(password);\n',
            ),
            'src/copy.ts': strToU8(loginV1),
            '.env': strToU8('SECRET=x'),
          }),
        ),
        'login.zip',
      )
      .expect(201);
    await owner
      .post('/api/providers')
      .send({ name: 'Fake', baseUrl: fakeUrl, model: 'fake-coder' })
      .expect(201);
    const run = `/api/projects/${project.id}/reviews`;
    const diff = (filePaths: string[]) =>
      owner.post(run).send({ mode: 'SECURITY', scope: 'DIFF', filePaths });

    replies = [
      JSON.stringify({
        summary: 'The change removes a check and logs a password.',
        issues: [
          {
            title: 'Password written to logs',
            description: 'd',
            severity: 'HIGH',
            filePath: 'login.v2.ts',
            line: 3,
          },
          // Points at the before file: the path is dropped, the issue stays.
          {
            title: 'Missing user check',
            description: 'd',
            severity: 'CRITICAL',
            filePath: 'src/login.ts',
            line: 2,
          },
        ],
        recommendations: [],
      }),
    ];
    prompts.length = 0;
    const { body: review } = await diff([
      'src/login.ts',
      'src/login.v2.ts',
    ]).expect(201);
    // Only the change is sent, with after-file numbers; removed lines unnumbered.
    const sent = JSON.parse(prompts[0]).messages[1].content as string;
    expect(sent).toContain('=== CHANGE: src/login.ts → src/login.v2.ts ===');
    expect(sent).toContain('    | -if (!user) throw err;');
    expect(sent).toContain('   3| +log(password);');
    expect(review).toMatchObject({
      scope: 'DIFF',
      filePaths: ['src/login.ts', 'src/login.v2.ts'],
      highestSeverity: 'CRITICAL',
    });
    expect(review.diff).toContain('+++ src/login.v2.ts');
    expect(review.issues[0].filePath).toBeUndefined();
    expect(review.issues[1]).toMatchObject({
      filePath: 'src/login.v2.ts',
      line: 3,
    });

    // Clear 400s before the model is called.
    const identical = await diff(['src/login.ts', 'src/copy.ts']).expect(400);
    expect(identical.body.message).toContain('identical');
    await diff(['src/login.ts', 'src/login.ts']).expect(400);
    await diff(['src/login.ts']).expect(400);
    await diff(['src/login.ts', 'nope.ts']).expect(400);
    await diff(['src/login.ts', '.env']).expect(400);
    expect(prompts).toHaveLength(1);
  });
});
