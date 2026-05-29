import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { OrgRole } from '@prisma/client';
import type { JwtUser } from '../../auth/current-user.decorator';
import type { OrgContextDto } from './org-context.types';

/**
 * Popula req.orgContext a partir del claim actingAs del JWT.
 * Si el JWT no tiene actingAs (modo personal), permite continuar sin orgContext.
 *
 * REQUIERE que JwtAuthGuard se haya ejecutado antes (consume req.user).
 * No realiza consultas a la base de datos — confía en los claims del JWT
 * (validados en POST /auth/switch-org; ventana de 7 días).
 */
@Injectable()
export class OrgContextGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const user = (req as Request & { user?: JwtUser }).user;
    if (!user) throw new UnauthorizedException('OrgContextGuard requiere JwtAuthGuard previo');

    if (!user.actingAs) return true; // modo personal, sin orgContext

    // JWT de org: confiar en los claims (validados en switch-org, ventana 7 días)
    const context: OrgContextDto = { orgId: user.sub, role: user.orgRole as OrgRole };
    (req as Request & { orgContext: OrgContextDto }).orgContext = context;
    return true;
  }
}
