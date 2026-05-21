import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PublicationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtUser } from '../auth/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

function profileInclude() {
  return {
    user: {
      select: {
        id: true,
        firstname: true,
        lastname: true,
        events: {
          where: {
            status: PublicationStatus.APPROVED,
            OR: [{ expirationDate: null }, { expirationDate: { gte: new Date() } }],
          },
          include: { categories: true, region: true, commune: true },
          orderBy: { createdAt: 'desc' as const },
          take: 20,
        },
      },
    },
  };
}

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Perfil público — solo visible si el usuario tiene al menos un evento aprobado. */
  async findPublic(slug: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { slug },
      include: profileInclude(),
    });
    if (!profile) throw new NotFoundException('Perfil no encontrado');

    const hasApproved = profile.user.events.length > 0;
    if (!hasApproved) throw new NotFoundException('Perfil no encontrado');

    return profile;
  }

  /** Mi perfil — siempre accesible para el propietario. */
  async findMine(user: JwtUser) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: user.sub },
      include: profileInclude(),
    });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    return profile;
  }

  async update(dto: UpdateProfileDto, user: JwtUser) {
    const profile = await this.prisma.profile.findUnique({ where: { userId: user.sub } });
    if (!profile) throw new NotFoundException('Perfil no encontrado');

    if (dto.slug && dto.slug !== profile.slug) {
      const conflict = await this.prisma.profile.findUnique({ where: { slug: dto.slug } });
      if (conflict) throw new ConflictException(`El slug "${dto.slug}" ya está en uso`);
    }

    return this.prisma.profile.update({
      where: { userId: user.sub },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.bio !== undefined && { bio: dto.bio }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.banner !== undefined && { banner: dto.banner }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.instagram !== undefined && { instagram: dto.instagram }),
        ...(dto.tiktok !== undefined && { tiktok: dto.tiktok }),
        ...(dto.facebook !== undefined && { facebook: dto.facebook }),
        ...(dto.x !== undefined && { x: dto.x }),
        ...(dto.youtube !== undefined && { youtube: dto.youtube }),
        ...(dto.twitch !== undefined && { twitch: dto.twitch }),
        ...(dto.linkedin !== undefined && { linkedin: dto.linkedin }),
      },
      include: profileInclude(),
    });
  }

  /** Admin: buscar perfil por userId. */
  async findByUserId(userId: number, requester: JwtUser) {
    const isAdmin = requester.role === 'ADMIN' || requester.role === 'SUPER_ADMIN';
    if (!isAdmin && requester.sub !== userId) throw new ForbiddenException();
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      include: profileInclude(),
    });
    if (!profile) throw new NotFoundException('Perfil no encontrado');
    return profile;
  }
}
