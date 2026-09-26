import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe('Providers (e2e)', () => {
  let app: INestApplication<App>;
  let fake: Server;
  let fakeUrl: string;
  // Authorization headers the fake provider received, in order.
  const seenAuth: (string | undefined)[] = [];
  const stamp = Date.now();
  const emails = [`prov-a-${stamp}@test.dev`, `prov-b-${stamp}@test.dev`];

  async function signedIn(email: string) {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Tester' })
      .expect(201);
    return agent;
  }

  beforeAll(async () => {
    // A tiny OpenAI-compatible server: GET /v1/models.
    fake = createServer((req, res) => {
      seenAuth.push(req.headers.authorization);
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          object: 'list',
          data: [
            { id: 'coder-7b', object: 'model', created: 0, owned_by: 'x' },
            { id: 'coder-3b', object: 'model', created: 0, owned_by: 'x' },
          ],
        }),
      );
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

  it('CRUD, default switching, encrypted keys and owner-only access', async () => {
    const owner = await signedIn(emails[0]);
    const other = await signedIn(emails[1]);

    const first = await owner
      .post('/api/providers')
      .send({
        name: 'Fake',
        baseUrl: `${fakeUrl}/`,
        model: 'coder-7b',
        apiKey: 'sk-secret-1',
      })
      .expect(201);
    expect(first.body).toEqual({
      id: first.body.id,
      name: 'Fake',
      baseUrl: fakeUrl, // trailing slash removed
      model: 'coder-7b',
      hasApiKey: true,
      isDefault: true, // first provider is used right away
    });
    const stored = await app
      .get(PrismaService)
      .aiProvider.findUniqueOrThrow({ where: { id: first.body.id } });
    expect(stored.apiKeyEncrypted).not.toContain('sk-secret-1');

    const second = await owner
      .post('/api/providers')
      .send({ name: 'Local', baseUrl: fakeUrl, model: 'coder-3b' })
      .expect(201);
    expect(second.body).toMatchObject({ hasApiKey: false, isDefault: false });

    await owner.post(`/api/providers/${second.body.id}/default`).expect(204);
    const list = await owner.get('/api/providers').expect(200);
    expect(list.body.map((p: { isDefault: boolean }) => p.isDefault)).toEqual([
      false,
      true,
    ]);

    // Edit without a key keeps it; a new URL without the key is refused.
    const edited = await owner
      .put(`/api/providers/${first.body.id}`)
      .send({ name: 'Fake 2', baseUrl: fakeUrl, model: 'coder-3b' })
      .expect(200);
    expect(edited.body).toMatchObject({ name: 'Fake 2', hasApiKey: true });
    await owner
      .put(`/api/providers/${first.body.id}`)
      .send({ name: 'Fake 2', baseUrl: 'http://127.0.0.2:9/v1', model: 'x' })
      .expect(400);

    await owner
      .post('/api/providers')
      .send({ name: 'Bad', baseUrl: 'ftp://x', model: 'm' })
      .expect(400);

    // Other users: 404 everywhere, and their list is empty.
    await other
      .put(`/api/providers/${first.body.id}`)
      .send({ name: 'x', baseUrl: fakeUrl, model: 'x' })
      .expect(404);
    await other.post(`/api/providers/${first.body.id}/default`).expect(404);
    await other.delete(`/api/providers/${first.body.id}`).expect(404);
    await other
      .post('/api/providers/test')
      .send({ baseUrl: fakeUrl, providerId: first.body.id })
      .expect(404);
    expect((await other.get('/api/providers').expect(200)).body).toEqual([]);

    // Deleting the default promotes the remaining provider.
    await owner.delete(`/api/providers/${second.body.id}`).expect(204);
    expect((await owner.get('/api/providers').expect(200)).body).toMatchObject([
      { id: first.body.id, isDefault: true },
    ]);
  });

  it('test connection lists models and only sends the stored key to its own URL', async () => {
    const owner = await signedIn(`prov-c-${stamp}@test.dev`);
    emails.push(`prov-c-${stamp}@test.dev`);
    const { body: provider } = await owner
      .post('/api/providers')
      .send({
        name: 'Fake',
        baseUrl: fakeUrl,
        model: 'coder-7b',
        apiKey: 'sk-stored',
      })
      .expect(201);

    seenAuth.length = 0;
    const ok = await owner
      .post('/api/providers/test')
      .send({ baseUrl: fakeUrl, providerId: provider.id })
      .expect(200);
    expect(ok.body).toEqual({
      ok: true,
      message: 'Connected. 2 models found.',
      models: ['coder-3b', 'coder-7b'],
    });
    expect(seenAuth).toEqual(['Bearer sk-stored']);

    // Same server, different URL text → the stored key is not sent.
    seenAuth.length = 0;
    await owner
      .post('/api/providers/test')
      .send({
        baseUrl: fakeUrl.replace('127.0.0.1', 'localhost'),
        providerId: provider.id,
      })
      .expect(200);
    expect(seenAuth).toEqual(['Bearer not-needed']);

    const down = await owner
      .post('/api/providers/test')
      .send({ baseUrl: 'http://127.0.0.1:9/v1' })
      .expect(200);
    expect(down.body).toMatchObject({ ok: false, models: [] });
    expect(down.body.message).toContain("Can't reach");
  });
});
