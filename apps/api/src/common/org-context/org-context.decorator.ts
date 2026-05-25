import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { OrgContextDto } from './org-context.types';

/**
 * Inyecta el contexto de organización resuelto por OrgContextGuard.
 * Devuelve null cuando el endpoint se llamó sin el header X-Org-Context.
 */
export const OrgContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): OrgContextDto | null => {
    const req = ctx.switchToHttp().getRequest();
    return (req.orgContext as OrgContextDto | undefined) ?? null;
  },
);
