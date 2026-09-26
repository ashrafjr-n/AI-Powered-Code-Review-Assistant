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

type SentMessage = { role: string; content: string };

describe('Chat (e2e)', () => {
  let app: INestApplication<App>;
  let fake: Server;
  let fakeUrl: string;
  let fail = false;
  const sent: SentMessage[][] = [];
  const stamp = Date.now();
  const emails = [`chat-a-${stamp}@test.dev`, `chat-b-${stamp}@test.dev`];

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
        if (fail) {
          res.statusCode = 500;
          res.end('{"error":{"message":"boom"}}');
          return;
        }
        const messages = (JSON.parse(body) as { messages: SentMessage[] })
          .messages;
        sent.push(messages);
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
                message: {
                  role: 'assistant',
                  content: `Answer #${sent.length}`,
                },
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

  it('answers with sources, keeps history, saves nothing on failure, owner only', async () => {
    const owner = await signedIn(emails[0]);
    const other = await signedIn(emails[1]);
    const { body: project } = await owner
      .post('/api/projects')
      .send({ name: 'Shop' })
      .expect(201);
    const base = `/api/projects/${project.id}/chats`;

    await owner.post(`${base}/messages`).send({ question: 'hi' }).expect(400); // no files yet
    await owner
      .post(`/api/projects/${project.id}/files`)
      .attach(
        'file',
        Buffer.from(
          zipSync({
            'README.md': strToU8('# Shop'),
            'src/db/pool.ts': strToU8('export const pool = connectDatabase();'),
            'src/auth/login.ts': strToU8('export function login() {}'),
          }),
        ),
        'shop.zip',
      )
      .expect(201);
    await owner
      .post('/api/providers')
      .send({ name: 'Fake', baseUrl: fakeUrl, model: 'fake' })
      .expect(201);

    // New conversation: the database file is retrieved and sent to the model.
    const first = await owner
      .post(`${base}/messages`)
      .send({ question: 'Which file handles the database connection?' })
      .expect(201);
    const sessionId: string = first.body.sessionId;
    expect(sent[0][0].role).toBe('system');
    expect(sent[0][0].content).toContain('=== FILE: src/db/pool.ts ===');
    expect(sent[0][0].content).not.toContain('=== FILE: src/auth/login.ts ===');

    // Follow-up in the same conversation: history goes along.
    await owner
      .post(`${base}/messages`)
      .send({ sessionId, question: 'And the login?' })
      .expect(201);
    expect(sent[1].map((m) => m.role)).toEqual([
      'system',
      'user',
      'assistant',
      'user',
    ]);
    expect(sent[1][0].content).toContain('=== FILE: src/auth/login.ts ===');

    // Model down → 502 and nothing saved.
    fail = true;
    const down = await owner
      .post(`${base}/messages`)
      .send({ sessionId, question: 'Anything else?' })
      .expect(502);
    expect(down.body.message).toContain('provider');
    fail = false;

    const { body: sessions } = await owner.get(base).expect(200);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].title).toBe(
      'Which file handles the database connection?',
    );
    expect(sessions[0].messages).toMatchObject([
      { role: 'USER', content: 'Which file handles the database connection?' },
      { role: 'ASSISTANT', content: 'Answer #1', sources: ['src/db/pool.ts'] },
      { role: 'USER', content: 'And the login?' },
      {
        role: 'ASSISTANT',
        content: 'Answer #2',
        sources: ['src/auth/login.ts'],
      },
    ]);

    // The open file is always sent ("explain this file" has no useful keywords).
    const open = await owner
      .post(`${base}/messages`)
      .send({ question: 'Explain this file', currentFile: 'src/auth/login.ts' })
      .expect(201);
    const last = () => sent[sent.length - 1][0].content;
    expect(last()).toContain('=== FILE: src/auth/login.ts ===');
    expect(last()).toContain('"src/auth/login.ts" open');
    // A follow-up without keywords reuses the previous answer's files.
    await owner
      .post(`${base}/messages`)
      .send({ sessionId: open.body.sessionId, question: 'and who calls it?' })
      .expect(201);
    expect(last()).toContain('=== FILE: src/auth/login.ts ===');
    // A path that isn't a readable project file is ignored.
    await owner
      .post(`${base}/messages`)
      .send({ question: 'Explain this file', currentFile: '../../etc/passwd' })
      .expect(201);
    expect(last()).toContain('No file matched the question');

    // Validation and ownership.
    await owner.post(`${base}/messages`).send({ question: '   ' }).expect(400);
    await owner
      .post(`${base}/messages`)
      .send({
        sessionId: '0190a000-0000-7000-8000-000000000000',
        question: 'x',
      })
      .expect(404);
    await other.get(base).expect(404);
    await other
      .post(`${base}/messages`)
      .send({ sessionId, question: 'steal' })
      .expect(404);
  });
});
