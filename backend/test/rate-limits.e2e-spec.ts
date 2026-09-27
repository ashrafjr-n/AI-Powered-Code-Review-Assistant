import { strToU8, zipSync } from 'fflate';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

const SECRET = 'e2e-bff-secret'; // set in setup-e2e.ts

describe('Rate limits (e2e)', () => {
  let app: INestApplication<App>;
  const stamp = Date.now();
  const emails = [
    `rl-a-${stamp}@test.dev`,
    `rl-b-${stamp}@test.dev`,
    `rl-c-${stamp}@test.dev`,
  ];
  const password = 'password123';

  const login = (email: string, pass: string, ip?: string, secret = SECRET) => {
    const req = request(app.getHttpServer()).post('/api/auth/login');
    if (ip) req.set('X-Client-IP', ip).set('X-BFF-Secret', secret);
    return req.send({ email, password: pass });
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.get(PrismaService).user.deleteMany({
      where: { email: { in: emails } },
    });
    await app.close();
  });

  it('counts signed-in requests per user, not per IP', async () => {
    const [a, b] = emails.map(() => request.agent(app.getHttpServer()));
    for (const [i, agent] of [a, b].entries())
      await agent
        .post('/api/auth/register')
        .set('X-Client-IP', `203.0.113.${i + 1}`)
        .set('X-BFF-Secret', SECRET)
        .send({ email: emails[i], password, name: 'Rate' })
        .expect(201);

    // Same machine (same IP) for both users. Default limit: 100 per minute.
    const statuses: number[] = [];
    for (let i = 0; i < 101; i++)
      statuses.push((await a.get('/api/projects')).status);
    expect(statuses.filter((s) => s === 200)).toHaveLength(100);
    expect(statuses.at(-1)).toBe(429);
    await b.get('/api/projects').expect(200); // user B has their own budget
  });

  it('allows 10 uploads a minute per user', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/register')
      .send({ email: emails[2], password, name: 'Rate' })
      .expect(201);
    const { body: project } = await agent
      .post('/api/projects')
      .send({ name: 'Uploads' })
      .expect(201);
    const zip = Buffer.from(zipSync({ 'a.ts': strToU8('const a = 1;') }));
    const upload = () =>
      agent
        .post(`/api/projects/${project.id}/files`)
        .attach('file', zip, 'code.zip');
    for (let i = 0; i < 10; i++) await upload().expect(201);
    await upload().expect(429);
  });

  it('uses X-Client-IP only with the right secret', async () => {
    // Right secret: each IP gets its own 10 logins per minute.
    for (let i = 0; i < 10; i++)
      await login(`nobody-${i}-${stamp}@test.dev`, 'x', '198.51.100.7').expect(
        401,
      );
    await login(`nobody-x-${stamp}@test.dev`, 'x', '198.51.100.7').expect(429);
    await login(`nobody-y-${stamp}@test.dev`, 'x', '198.51.100.8').expect(401);

    // Wrong secret: the header is ignored, every request counts for the real caller.
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++)
      statuses.push(
        (
          await login(
            `fake-${i}-${stamp}@test.dev`,
            'x',
            `198.51.100.${100 + i}`,
            'wrong-secret',
          )
        ).status,
      );
    expect(statuses.at(-1)).toBe(429);
  });

  it('locks an account for one IP after 5 failed logins', async () => {
    const [email] = emails;
    for (let i = 0; i < 5; i++)
      await login(email, 'wrong-password', '192.0.2.10').expect(401);
    const locked = await login(email, password, '192.0.2.10').expect(429);
    expect(locked.body.code).toBe('LOGIN_LOCKED');
    // The real owner on another network can still sign in.
    await login(email, password, '192.0.2.11').expect(200);
  });
});
