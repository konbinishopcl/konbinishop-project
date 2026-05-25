import type { OrgRole } from '@prisma/client';

/**
 * Contexto de organización resuelto desde el header X-Org-Context.
 * El guard lo asigna a req.orgContext; null cuando no hay header (modo personal).
 */
export type OrgContextDto = {
  orgId: number;
  role: OrgRole;
};

declare module 'express-serve-static-core' {
  interface Request {
    orgContext?: OrgContextDto;
  }
}
