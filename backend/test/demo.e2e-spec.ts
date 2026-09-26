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

describe('Demo model (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let fake: Server;
  let fakeUrl: string;
  let reply: 'ok' | 'fail' | 'busy' = 'ok';
  const seenAuth: (string | undefined)[] = [];
  const stamp = Date.now();
  const emails: string[] = [];

  /** A signed-in user with one uploaded project; returns an ask() helper. */
  async function userWithProject(label: string) {
    const email = `demo-${label}-${stamp}@test.dev`;
    emails.push(email);
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Tester' })
      .expect(201);
    const { body: project } = await agent
      .post('/api/projects')
      .send({ name: 'P' })
      .expect(201);
    await agent
      .post(`/api/projects/${project.id}/files`)
      .attach(
        'file',
        Buffer.from(zipSync({ 'a.ts': strToU8('const a = 1;') })),
        'a.zip',
      )
      .expect(201);
    const ask = () =>
      agent
        .post(`/api/projects/${project.id}/chats/messages`)
        .send({ question: 'What is a?' });
    return { agent, ask };
  }

  async function siteTotalToday(): Promise<number> {
    const now = new Date();
    const day = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const { _sum } = await prisma.demoUsage.aggregate({
      where: { day },
      _sum: { count: true },
    });
    return _sum.count ?? 0;
  }

  beforeAll(async () => {
    fake = createServer((req, res) => {
      req.resume();
      req.on('end', () => {
        seenAuth.push(req.headers.authorization);
        if (reply !== 'ok') {
          res.statusCode = reply === 'busy' ? 429 : 500;
          res.end('{"error":{"message":"nope"}}');
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            id: 'x',
            object: 'chat.completion',
            created: 0,
            model: 'demo',
            choices: [
              {
                index: 0,
                finish_reason: 'stop',
                message: { role: 'assistant', content: 'a is 1.' },
              },
            ],
          }),
        );
      });
    });
    await new Promise<void>((resolve) => fake.listen(0, resolve));
    fakeUrl = `http://127.0.0.1:${(fake.address() as AddressInfo).port}/v1`;

    process.env.DEMO_BASE_URL = fakeUrl;
    process.env.DEMO_MODEL = 'demo-model';
    process.env.DEMO_API_KEY = 'demo-secret';
    process.env.DEMO_DAILY_LIMIT_PER_USER = '2';
    process.env.DEMO_DAILY_LIMIT_TOTAL = '1000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    await app.close();
    fake.close();
  });

  it('per-user limit, status, and own provider wins', async () => {
    const a = await userWithProject('a');
    const status = await a.agent.get('/api/providers/demo').expect(200);
    expect(status.body).toMatchObject({
      enabled: true,
      model: 'demo-model',
      used: 0,
      limit: 2,
      siteLimitReached: false,
    });

    await a.ask().expect(201);
    await a.ask().expect(201);
    expect(seenAuth.at(-1)).toBe('Bearer demo-secret');
    const blocked = await a.ask().expect(429);
    expect(blocked.body).toMatchObject({ code: 'DEMO_LIMIT', reason: 'user' });
    expect(new Date(blocked.body.resetsAt).getUTCHours()).toBe(0);
    expect((await a.agent.get('/api/providers/demo')).body.used).toBe(2);

    // Their own provider has no demo limit.
    await a.agent
      .post('/api/providers')
      .send({ name: 'Own', baseUrl: fakeUrl, model: 'own' })
      .expect(201);
    await a.ask().expect(201);
    expect(seenAuth.at(-1)).toBe('Bearer not-needed');
  });

  it('gives the request back when the model fails, and says "busy" on 429', async () => {
    const b = await userWithProject('b');
    reply = 'fail';
    await b.ask().expect(502);
    reply = 'busy';
    expect((await b.ask().expect(503)).body.code).toBe('DEMO_BUSY');
    reply = 'ok';
    expect((await b.agent.get('/api/providers/demo')).body.used).toBe(0);
  });

  it('stops everyone at the site total', async () => {
    process.env.DEMO_DAILY_LIMIT_TOTAL = String((await siteTotalToday()) + 1);
    const c = await userWithProject('c');
    const d = await userWithProject('d');
    await c.ask().expect(201);
    const blocked = await d.ask().expect(429);
    expect(blocked.body).toMatchObject({ code: 'DEMO_LIMIT', reason: 'site' });
    expect(
      (await d.agent.get('/api/providers/demo')).body.siteLimitReached,
    ).toBe(true);
    process.env.DEMO_DAILY_LIMIT_TOTAL = '1000';
  });

  it('parallel requests cannot pass the limit', async () => {
    const e = await userWithProject('e');
    const results = await Promise.all([
      e.ask(),
      e.ask(),
      e.ask(),
      e.ask(),
      e.ask(),
    ]);
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 201, 429, 429, 429]);
  });

  it('is off when the server has no demo config', async () => {
    delete process.env.DEMO_BASE_URL;
    const f = await userWithProject('f');
    expect((await f.agent.get('/api/providers/demo')).body).toEqual({
      enabled: false,
    });
    expect((await f.ask().expect(400)).body.message).toContain(
      'Add a model provider',
    );
  });
});
