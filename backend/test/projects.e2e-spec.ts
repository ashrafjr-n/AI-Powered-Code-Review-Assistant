import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe('Projects (e2e)', () => {
  let app: INestApplication<App>;
  const stamp = Date.now();
  const emails = [`owner-${stamp}@test.dev`, `other-${stamp}@test.dev`];

  async function signedIn(email: string) {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Tester' })
      .expect(201);
    return agent;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    // Cascade deletes their projects too.
    await app
      .get(PrismaService)
      .user.deleteMany({ where: { email: { in: emails } } });
    await app.close();
  });

  it('requires login', () => {
    return request(app.getHttpServer()).get('/api/projects').expect(401);
  });

  it('create → list → get → delete, and other users cannot see it', async () => {
    const owner = await signedIn(emails[0]);
    const other = await signedIn(emails[1]);

    const created = await owner
      .post('/api/projects')
      .send({ name: '  CRM Backend  ' })
      .expect(201);
    expect(created.body).toMatchObject({
      name: 'CRM Backend',
      description: '',
      fileCount: 0,
    });
    const id: string = created.body.id;

    const list = await owner.get('/api/projects').expect(200);
    expect(list.body.map((project: { id: string }) => project.id)).toEqual([
      id,
    ]);

    await owner.get(`/api/projects/${id}`).expect(200);
    await other.get(`/api/projects/${id}`).expect(404);
    await other.delete(`/api/projects/${id}`).expect(404);
    expect((await other.get('/api/projects').expect(200)).body).toEqual([]);

    await owner.get('/api/projects/not-a-uuid').expect(400);
    await owner.post('/api/projects').send({ name: '' }).expect(400);

    await owner.delete(`/api/projects/${id}`).expect(204);
    await owner.get(`/api/projects/${id}`).expect(404);
  });
});
