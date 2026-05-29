import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import type { Request } from 'express';
import { PublicationStatus, UserType } from '@prisma/client';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { JwtUser } from '../auth/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EventsService } from '../events/events.service';

// Campos públicos del usuario (nunca exponemos passwordHash).
const USER_SELECT = {
  id: true,
  email: true,
  firstname: true,
  lastname: true,
  rut: true,
  isCompany: true,
  role: true,
  confirmed: true,
  blocked: true,
  // v2 fields
  type: true,
  handle: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly events: EventsService,
  ) {}

  findAll() {
    return this.prisma.user.findMany({ select: USER_SELECT, orderBy: { id: 'asc' } });
  }

  findRecent() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        firstname: true,
        lastname: true,
        profile: { select: { avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  findSavedEventsForUser(userId: number, page = 1, pageSize = 12) {
    return this.events.findSavedByUser(userId, page, pageSize);
  }

  async findByHandle(handle: string) {
    const user = await this.prisma.user.findUnique({
      where: { handle },
      select: {
        id: true,
        handle: true,
        firstname: true,
        lastname: true,
        type: true,
        isVerified: true,
        blocked: true,
        createdAt: true,
        profile: {
          select: {
            displayName: true, bio: true, avatar: true, banner: true, website: true,
            instagram: true, tiktok: true, facebook: true, x: true, youtube: true, twitch: true, linkedin: true,
          },
        },
      },
    });
    if (!user || user.blocked) throw new NotFoundException('Usuario no encontrado');

    // Eventos APPROVED recientes (max 12)
    const events = await this.prisma.event.findMany({
      where: { userId: user.id, status: PublicationStatus.APPROVED },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: {
        city: { include: { state: { include: { country: true } } } },
        eventCategory: true,
        dates: true,
      },
    });

    // Si es ORGANIZATION, traer artículos patrocinados APPROVED
    let articles: any[] = [];
    if (user.type === UserType.ORGANIZATION) {
      articles = await this.prisma.article.findMany({
        where: { userId: user.id, status: PublicationStatus.APPROVED },
        orderBy: { createdAt: 'desc' },
        take: 12,
        include: { articleTags: true },
      });
    }

    // No exponer blocked al cliente — quitar del response
    const { blocked: _blocked, ...publicUser } = user;
    return { ...publicUser, events, articles };
  }

  async setVerified(id: number, isVerified: boolean, actor: JwtUser, req?: Request) {
    const before = await this.ensure(id);
    const result = await this.prisma.user.update({
      where: { id },
      data: { isVerified },
      select: USER_SELECT,
    });
    // Audit solo si cambió
    if (before.isVerified !== isVerified) {
      this.audit.log({
        userId: actor.sub,
        action: 'UPDATE',
        entity: 'USER',
        entityId: id,
        metadata: { prevVerified: before.isVerified, newVerified: isVerified },
        req,
      });
    }
    return result;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El email ya está registrado');
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: await hash(dto.password, 10),
        firstname: dto.firstname,
        lastname: dto.lastname,
        role: dto.role ?? 'AUTHENTICATED',
        confirmed: true,
      },
      select: USER_SELECT,
    });
  }

  async update(id: number, dto: UpdateUserDto, actor: JwtUser, req?: Request) {
    const before = await this.ensure(id);
    const result = await this.prisma.user.update({ where: { id }, data: { ...dto }, select: USER_SELECT });
    if (dto.role !== undefined && dto.role !== before.role) {
      this.audit.log({
        userId: actor.sub,
        action: 'UPDATE',
        entity: 'USER',
        entityId: id,
        metadata: { prevRole: before.role, newRole: dto.role },
        req,
      });
    }
    return result;
  }

  async setBanned(id: number, blocked: boolean, actor: JwtUser, req?: Request) {
    await this.ensure(id);
    const result = await this.prisma.user.update({ where: { id }, data: { blocked }, select: USER_SELECT });
    this.audit.log({
      userId: actor.sub,
      action: blocked ? 'BAN' : 'UNBAN',
      entity: 'USER',
      entityId: id,
      req,
    });
    return result;
  }

  async remove(id: number, actor: JwtUser, req?: Request) {
    await this.ensure(id);
    await this.prisma.user.delete({ where: { id } });
    this.audit.log({
      userId: actor.sub,
      action: 'DELETE',
      entity: 'USER',
      entityId: id,
      req,
    });
    return { deleted: true };
  }

  private async ensure(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
}
