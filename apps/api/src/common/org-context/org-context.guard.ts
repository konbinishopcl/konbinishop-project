import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../../utils/prisma/prisma.service';
import type { JwtUser } from '../../auth/current-user.decorator';
import type { OrgContextDto } from './org-context.types';

/**
 * Lee el header X-Org-Context y valida que el usuario autenticado sea miembro
 * de esa organización. Si el header está ausente, permite continuar (req.orgContext queda undefined).
 *
 * REQUIERE que JwtAuthGuard se haya ejecutado antes (consume req.user).
 */
@Injectable()
export class OrgContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const raw = req.headers['x-org-context'];
    if (!raw) return true; // modo personal: el endpoint se ejecuta sin contexto de org

    const user = (req as Request & { user?: JwtUser }).user;
    if (!user) throw new UnauthorizedException('OrgContextGuard requiere JwtAuthGuard previo');

    const orgId = Number(Array.isArray(raw) ? raw[0] : raw);
    if (!Number.isInteger(orgId) || orgId <= 0) {
      throw new ForbiddenException('X-Org-Context inválido');
    }

    // 1. Validar que la org existe y es del tipo ORGANIZATION y no está blocked.
    const org = await this.prisma.user.findUnique({
      where: { id: orgId },
      select: { id: true, type: true, blocked: true },
    });
    if (!org || org.type !== 'ORGANIZATION') {
      throw new NotFoundException('Organización no encontrada');
    }
    if (org.blocked) {
      throw new ForbiddenException('Organización bloqueada');
    }

    // 2. Validar membresía del usuario autenticado.
    const member = await this.prisma.orgMember.findUnique({
      where: { userId_orgId: { userId: user.sub, orgId } },
      select: { role: true },
    });
    if (!member) {
      throw new ForbiddenException('No eres miembro de esta organización');
    }

    const context: OrgContextDto = { orgId, role: member.role };
    (req as Request & { orgContext: OrgContextDto }).orgContext = context;
    return true;
  }
}
