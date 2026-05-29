import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../utils/prisma/prisma.service';
import type { JwtUser } from '../auth/current-user.decorator';

export type LikeTarget = 'event' | 'article';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  async like(target: LikeTarget, targetId: number, user: JwtUser) {
    await this.assertTargetExists(target, targetId);
    const userId = user.actingAs ?? user.sub;
    try {
      await this.prisma.like.create({
        data: { userId, [`${target}Id`]: targetId },
      });
    } catch {
      throw new ConflictException('Ya le diste like a esta publicación');
    }
    const count = await this.countLikes(target, targetId);
    return { liked: true, likes: count };
  }

  async likedBatch(articleIds: number[], user: JwtUser): Promise<number[]> {
    if (!articleIds.length) return [];
    const userId = user.actingAs ?? user.sub;
    const rows = await this.prisma.like.findMany({
      where: { userId, articleId: { in: articleIds } },
      select: { articleId: true },
    });
    return rows.map((r) => r.articleId!);
  }

  async status(target: LikeTarget, targetId: number, user: JwtUser) {
    const userId = user.actingAs ?? user.sub;
    const existing = await this.prisma.like.findFirst({
      where: { userId, [`${target}Id`]: targetId },
    });
    const count = await this.countLikes(target, targetId);
    return { liked: !!existing, likes: count };
  }

  async unlike(target: LikeTarget, targetId: number, user: JwtUser) {
    const userId = user.actingAs ?? user.sub;
    const existing = await this.prisma.like.findFirst({
      where: { userId, [`${target}Id`]: targetId },
    });
    if (!existing) throw new NotFoundException('No le habías dado like a esta publicación');
    await this.prisma.like.delete({ where: { id: existing.id } });
    const count = await this.countLikes(target, targetId);
    return { liked: false, likes: count };
  }

  private async assertTargetExists(target: LikeTarget, id: number) {
    const record = await (this.prisma[target] as any).findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`${target} no encontrado`);
  }

  private countLikes(target: LikeTarget, targetId: number) {
    return this.prisma.like.count({ where: { [`${target}Id`]: targetId } });
  }
}
