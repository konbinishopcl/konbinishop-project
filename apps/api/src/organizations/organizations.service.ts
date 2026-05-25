import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrgRole, Prisma, UserType } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { JwtUser } from '../auth/current-user.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

// Campos públicos de una organización (sin datos sensibles de usuario)
const ORG_PUBLIC_SELECT = {
  id: true,
  email: true,
  handle: true,
  firstname: true,
  lastname: true,
  type: true,
  isVerified: true,
  blocked: true,
  confirmed: true,
  createdAt: true,
  updatedAt: true,
  profile: true,
  orgMembers: {
    select: { userId: true, role: true },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Crea una organización (User con type=ORGANIZATION) y registra al creador
   * como OWNER en la misma transacción atómica.
   */
  async create(dto: CreateOrganizationDto, user: JwtUser, req?: Request) {
    let org: { id: number };

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const newOrg = await tx.user.create({
          data: {
            email: dto.email,
            firstname: dto.name,
            handle: dto.handle,
            type: UserType.ORGANIZATION,
            passwordHash: null,
            confirmed: true,
            role: 'AUTHENTICATED',
          },
          select: ORG_PUBLIC_SELECT,
        });

        await tx.orgMember.create({
          data: {
            userId: user.sub,
            orgId: newOrg.id,
            role: OrgRole.OWNER,
          },
        });

        return newOrg;
      });

      org = result;

      this.audit.log({
        userId: user.sub,
        action: 'CREATE',
        entity: 'USER',
        entityId: result.id,
        metadata: { orgCreation: true },
        req,
      });

      return result;
    } catch (err) {
      this.handlePrismaError(err);
      throw err;
    }
  }

  /**
   * Devuelve una organización por ID. Solo accesible para miembros o admins.
   */
  async findOne(id: number, user: JwtUser) {
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    const org = await this.prisma.user.findUnique({
      where: { id },
      select: ORG_PUBLIC_SELECT,
    });

    if (!org || org.type !== UserType.ORGANIZATION) {
      throw new NotFoundException('Organización no encontrada');
    }

    if (org.blocked && !isAdmin) {
      throw new NotFoundException('Organización no encontrada');
    }

    if (!isAdmin) {
      const membership = await this.prisma.orgMember.findUnique({
        where: { userId_orgId: { userId: user.sub, orgId: id } },
      });

      if (!membership) {
        throw new ForbiddenException('No eres miembro de esta organización');
      }
    }

    return org;
  }

  /**
   * Actualiza los datos de una organización. Solo OWNER de la org o ADMIN+.
   */
  async update(id: number, dto: UpdateOrganizationDto, user: JwtUser, req?: Request) {
    await this.assertOrg(id);
    await this.assertOwnerOrAdmin(id, user);

    // Si se envía `name`, tiene prioridad para User.firstname.
    // `firstname` es un alias más explícito del campo del modelo.
    const firstname = dto.name ?? dto.firstname;

    try {
      const result = await this.prisma.user.update({
        where: { id },
        data: {
          ...(dto.email !== undefined && { email: dto.email }),
          ...(firstname !== undefined && { firstname }),
          ...(dto.lastname !== undefined && { lastname: dto.lastname }),
          ...(dto.handle !== undefined && { handle: dto.handle }),
        },
        select: ORG_PUBLIC_SELECT,
      });

      this.audit.log({
        userId: user.sub,
        action: 'UPDATE',
        entity: 'USER',
        entityId: id,
        metadata: { orgUpdate: true },
        req,
      });

      return result;
    } catch (err) {
      this.handlePrismaError(err);
      throw err;
    }
  }

  /**
   * Elimina una organización. Solo OWNER o ADMIN+.
   * El cascade del schema elimina OrgMember y OrgInvitation automáticamente.
   */
  async remove(id: number, user: JwtUser, req?: Request): Promise<{ deleted: true }> {
    await this.assertOrg(id);
    await this.assertOwnerOrAdmin(id, user);

    await this.prisma.user.delete({ where: { id } });

    this.audit.log({
      userId: user.sub,
      action: 'DELETE',
      entity: 'USER',
      entityId: id,
      metadata: { orgDeletion: true },
      req,
    });

    return { deleted: true };
  }

  // ─────────────────────── Helpers privados ───────────────────────

  /**
   * Verifica que el usuario sea OWNER de la org o tenga rol ADMIN/SUPER_ADMIN.
   * Lanza ForbiddenException si no cumple ninguna de las dos condiciones.
   */
  private async assertOwnerOrAdmin(orgId: number, user: JwtUser): Promise<void> {
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (isAdmin) return;

    const membership = await this.prisma.orgMember.findUnique({
      where: { userId_orgId: { userId: user.sub, orgId } },
    });

    if (!membership || membership.role !== OrgRole.OWNER) {
      throw new ForbiddenException('Solo el OWNER de la organización puede realizar esta acción');
    }
  }

  /**
   * Verifica que el ID pertenezca a un User de type=ORGANIZATION existente.
   * Lanza NotFoundException si no existe o no es organización.
   */
  private async assertOrg(id: number) {
    const org = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, type: true },
    });

    if (!org || org.type !== UserType.ORGANIZATION) {
      throw new NotFoundException('Organización no encontrada');
    }

    return org;
  }

  /**
   * Interpreta errores de Prisma y lanza excepciones HTTP apropiadas.
   * P2002 (unique constraint): determina el campo en conflicto.
   */
  private handlePrismaError(err: unknown): void {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const target = (err.meta?.target as string[] | undefined) ?? [];
      const field = target.includes('email')
        ? 'email'
        : target.includes('handle')
          ? 'handle'
          : 'campo único';
      throw new ConflictException(`El ${field} ya está en uso`);
    }
  }
}
