import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { MessageRole } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { providerClient } from '../providers/provider-client.js';
import { ProvidersService } from '../providers/providers.service.js';
import { buildChatMessages, HISTORY_MESSAGES } from './chat-prompt.js';
import type { AskDto } from './chat.schemas.js';
import { rankFiles } from './retrieval.js';

// Same limit as reviews: answer before the frontend's fetch gives up (300 s).
const CHAT_TIMEOUT_MS = 270_000;

export interface ChatMessageView {
  id: string;
  role: MessageRole;
  content: string;
  sources: string[];
  createdAt: Date;
}

export interface ChatSessionView {
  id: string;
  projectId: string;
  title: string;
  createdAt: Date;
  messages: ChatMessageView[];
}

const messageSelect = {
  id: true,
  role: true,
  content: true,
  sources: true,
  createdAt: true,
} as const;

function titleFrom(question: string): string {
  return question.length > 60 ? `${question.slice(0, 57)}…` : question;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: ProvidersService,
  ) {}

  // ponytail: returns every session with all messages; load only the open one if
  // conversations get long.
  async listSessions(
    userId: string,
    projectId: string,
  ): Promise<ChatSessionView[]> {
    await this.findProject(userId, projectId);
    return this.prisma.chatSession.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        projectId: true,
        title: true,
        createdAt: true,
        messages: { orderBy: { createdAt: 'asc' }, select: messageSelect },
      },
    });
  }

  /** Answers a question. Nothing is saved unless the model answers. Returns the session id. */
  async ask(
    userId: string,
    projectId: string,
    dto: AskDto,
  ): Promise<{ sessionId: string }> {
    const askedAt = new Date();
    const project = await this.findProject(userId, projectId);
    const session = dto.sessionId
      ? await this.prisma.chatSession.findFirst({
          where: { id: dto.sessionId, projectId },
          select: {
            id: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: HISTORY_MESSAGES,
              select: { role: true, content: true },
            },
          },
        })
      : null;
    if (dto.sessionId && !session)
      throw new NotFoundException('Conversation not found');

    const files = await this.prisma.file.findMany({
      where: { projectId },
      orderBy: { path: 'asc' },
      select: { path: true, content: true },
    });
    if (files.length === 0)
      throw new BadRequestException('Upload the project code first.');

    const sourcePaths = rankFiles(dto.question, files);
    const answer = await this.callModel(userId, {
      projectName: project.name,
      allPaths: files.map((file) => file.path),
      sources: sourcePaths.map((path) =>
        files.find((file) => file.path === path)!,
      ),
      history: (session?.messages ?? []).reverse(),
      question: dto.question,
    });

    // Explicit times: both rows in one transaction would otherwise share now().
    return this.prisma.$transaction(async (tx) => {
      const sessionId =
        session?.id ??
        (
          await tx.chatSession.create({
            data: { projectId, title: titleFrom(dto.question) },
            select: { id: true },
          })
        ).id;
      await tx.message.createMany({
        data: [
          {
            sessionId,
            role: 'USER',
            content: dto.question,
            createdAt: askedAt,
          },
          {
            sessionId,
            role: 'ASSISTANT',
            content: answer,
            sources: sourcePaths,
            createdAt: new Date(),
          },
        ],
      });
      return { sessionId };
    });
  }

  private callModel(
    userId: string,
    input: Parameters<typeof buildChatMessages>[0],
  ): Promise<string> {
    // SDK errors bubble up to useProvider(), which turns them into a 502.
    return this.providers.useProvider(userId, async (provider) => {
      const completion = await providerClient(
        provider.baseUrl,
        provider.apiKey,
        CHAT_TIMEOUT_MS,
      ).chat.completions.create({
        model: provider.model,
        messages: buildChatMessages(input),
      });
      const answer = completion.choices[0]?.message?.content?.trim();
      if (!answer)
        throw new BadGatewayException('The model returned an empty answer.');
      return answer.slice(0, 20_000);
    });
  }

  private async findProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { name: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
