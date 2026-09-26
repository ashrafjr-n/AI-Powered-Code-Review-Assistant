import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { strToU8, zipSync } from 'fflate';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe('Files (e2e)', () => {
  let app: INestApplication<App>;
  const stamp = Date.now();
  const emails = [
    `files-owner-${stamp}@test.dev`,
    `files-other-${stamp}@test.dev`,
  ];

  async function signedIn(email: string) {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Tester' })
      .expect(201);
    return agent;
  }

  const zip = (files: Record<string, string>) =>
    Buffer.from(
      zipSync(
        Object.fromEntries(
          Object.entries(files).map(([name, text]) => [name, strToU8(text)]),
        ),
      ),
    );

  beforeAll(async () => {
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
  });

  it('upload → list → content, replace on re-upload, and owner-only access', async () => {
    const owner = await signedIn(emails[0]);
    const other = await signedIn(emails[1]);
    const { body: project } = await owner
      .post('/api/projects')
      .send({ name: 'Shop' })
      .expect(201);
    const base = `/api/projects/${project.id}/files`;

    const upload = await owner
      .post(base)
      .attach(
        'file',
        zip({ 'src/app.ts': 'const a = 1;', 'README.md': '# Shop' }),
        'shop.zip',
      )
      .expect(201);
    expect(upload.body).toEqual({ fileCount: 2 });

    const list = await owner.get(base).expect(200);
    expect(list.body).toEqual([
      { path: 'README.md', size: 6 },
      { path: 'src/app.ts', size: 12 },
    ]);
    const file = await owner
      .get(`${base}/content`)
      .query({ path: 'src/app.ts' })
      .expect(200);
    expect(file.body.content).toBe('const a = 1;');
    await owner.get(`${base}/content`).query({ path: 'nope.ts' }).expect(404);
    await owner.get(`${base}/content`).expect(400);

    // A new upload replaces the old files.
    await owner
      .post(base)
      .attach('file', zip({ 'b.ts': 'b' }), 'b.zip')
      .expect(201);
    expect((await owner.get(base).expect(200)).body).toEqual([
      { path: 'b.ts', size: 1 },
    ]);

    await other.get(base).expect(404);
    await other
      .post(base)
      .attach('file', zip({ 'x.ts': 'x' }), 'x.zip')
      .expect(404);
    await other.get(`${base}/content`).query({ path: 'b.ts' }).expect(404);
  });

  it('rejects missing, broken and too large uploads', async () => {
    const owner = await signedIn(`files-limits-${stamp}@test.dev`);
    emails.push(`files-limits-${stamp}@test.dev`);
    const { body: project } = await owner
      .post('/api/projects')
      .send({ name: 'Limits' })
      .expect(201);
    const base = `/api/projects/${project.id}/files`;

    await owner.post(base).expect(400);
    await owner
      .post(base)
      .attach('file', Buffer.from('not a zip'), 'fake.zip')
      .expect(400);
    await owner
      .post(base)
      .attach('file', Buffer.alloc(10 * 1024 * 1024 + 1), 'big.zip')
      .expect(413);
  });
});
