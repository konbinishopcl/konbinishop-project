import type { NotificationType, Prisma } from '@prisma/client';

/**
 * Parámetros internos para crear una notificación (no es DTO HTTP).
 * Exactamente uno de userId/orgId debe estar presente.
 */
export interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  body?: string;
  payload?: Prisma.InputJsonValue; // cast obligatorio (lección Phase 07)
  userId?: number;                  // exactamente uno de userId/orgId
  orgId?: number;
}
