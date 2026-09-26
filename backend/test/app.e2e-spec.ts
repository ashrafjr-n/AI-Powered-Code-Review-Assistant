import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe('API (e2e)', () => {
  let app: INestApplication<App>;
  const email = `e2e-${Date.now()}@test.dev`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.get(PrismaService).user.deleteMany({ where: { email } });
    await app.close();
  });

  it('GET /api/health is public', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('rejects protected routes without a login', () => {
    return request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('rejects invalid register input', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short', name: '' })
      .expect(400);
    expect(JSON.stringify(res.body)).toContain('email');
  });

  it('register → me → logout → login flow', async () => {
    const agent = request.agent(app.getHttpServer()); // keeps cookies like a browser

    const registered = await agent
      .post('/api/auth/register')
      .send({
        email: `  ${email.toUpperCase()} `,
        password: 'password123',
        name: 'E2E',
      })
      .expect(201);
    expect(registered.body).toEqual({
      id: expect.any(String),
      email,
      name: 'E2E',
    });
    expect(registered.headers['set-cookie']?.[0]).toMatch(
      /access_token=.*HttpOnly/,
    );

    await agent.get('/api/auth/me').expect(200).expect(registered.body);

    await agent
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Dup' })
      .expect(409);

    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);

    await agent
      .post('/api/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);
    await agent
      .post('/api/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    await agent.get('/api/auth/me').expect(200);
  });
});
