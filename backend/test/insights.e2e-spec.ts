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

describe('Insights (e2e)', () => {
  let app: INestApplication<App>;
  let fake: Server;
  let fakeUrl: string;
  let answer = '# Docs v1';
  const prompts: string[] = [];
  const stamp = Date.now();
  const emails = [`ins-a-${stamp}@test.dev`, `ins-b-${stamp}@test.dev`];

  async function signedIn(email: string) {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Tester' })
      .expect(201);
    return agent;
  }

  beforeAll(async () => {
    fake = createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        prompts.push(body);
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
                message: { role: 'assistant', content: answer },
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

  it('generates, saves, regenerates (replace) and stays owner-only', async () => {
    const owner = await signedIn(emails[0]);
    const other = await signedIn(emails[1]);
    const { body: project } = await owner
      .post('/api/projects')
      .send({ name: 'Shop' })
      .expect(201);
    const base = `/api/projects/${project.id}/insights`;

    await owner.post(base).send({ kind: 'README' }).expect(400); // no files yet
    await owner
      .post(`/api/projects/${project.id}/files`)
      .attach(
        'file',
        Buffer.from(
          zipSync({
            'package.json': strToU8('{"scripts":{"dev":"node src/main.js"}}'),
            'src/main.js': strToU8('app.listen(3000)'),
            'src/routes/users.js': strToU8('router.get("/users")'),
          }),
        ),
        'shop.zip',
      )
      .expect(201);
    await owner.post(base).send({ kind: 'README' }).expect(400); // no provider
    await owner
      .post('/api/providers')
      .send({ name: 'Fake', baseUrl: fakeUrl, model: 'fake-docs' })
      .expect(201);

    const { body: first } = await owner
      .post(base)
      .send({ kind: 'API_DOCS' })
      .expect(201);
    expect(first).toMatchObject({
      kind: 'API_DOCS',
      content: '# Docs v1',
      providerName: 'Fake',
      model: 'fake-docs',
    });
    // Route files go first for API docs.
    expect(first.filePaths[0]).toBe('src/routes/users.js');
    expect(prompts.at(-1)).toContain('API documentation');

    answer = '# Docs v2';
    await owner.post(base).send({ kind: 'API_DOCS' }).expect(201);
    await owner.post(base).send({ kind: 'ARCHITECTURE' }).expect(201);
    const { body: list } = await owner.get(base).expect(200);
    expect(list.map((i: { kind: string }) => i.kind).sort()).toEqual([
      'API_DOCS',
      'ARCHITECTURE',
    ]);
    expect(
      list.find((i: { kind: string }) => i.kind === 'API_DOCS').content,
    ).toBe('# Docs v2');

    await owner.post(base).send({ kind: 'POEM' }).expect(400);
    await other.get(base).expect(404);
    await other.post(base).send({ kind: 'README' }).expect(404);
  });
});
