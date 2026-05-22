import { Injectable } from '@nestjs/common';
import { PublicationStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../../utils/prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();

    const [
      users,
      eventsApproved,
      pendingEvents,
      pendingSpots,
      pendingHeroes,
      revenueResult,
      activeSpots,
      activeHeroes,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.event.count({ where: { status: PublicationStatus.APPROVED } }),
      this.prisma.event.count({ where: { status: PublicationStatus.PENDING_MODERATION } }),
      this.prisma.spot.count({ where: { status: PublicationStatus.PENDING_MODERATION } }),
      this.prisma.hero.count({ where: { status: PublicationStatus.PENDING_MODERATION } }),
      this.prisma.order.aggregate({ where: { status: OrderStatus.PAID }, _sum: { total: true } }),
      this.prisma.spot.count({ where: { status: PublicationStatus.APPROVED, expirationDate: { gte: now } } }),
      this.prisma.hero.count({ where: { status: PublicationStatus.APPROVED, expirationDate: { gte: now } } }),
    ]);

    return {
      users,
      eventsApproved,
      pendingModeration: pendingEvents + pendingSpots + pendingHeroes,
      totalRevenue: revenueResult._sum.total ?? 0,
      activeSpots,
      activeHeroes,
    };
  }
}
