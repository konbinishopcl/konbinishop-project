import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrgRole, Prisma, UserType } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import { PrismaService } from '../../utils/prisma/prisma.service';
import { MailService } from '../../services/mailgun/mail.service';
import { AuditService } from '../audit/audit.service';
import type { JwtUser } from '../auth/current-user.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

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
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
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

  // ─────────────────────── Membresías e invitaciones ───────────────────────

  /**
   * Lista todos los miembros de una organización.
   * Solo accesible para miembros de la org o ADMIN+.
   */
  async listMembers(orgId: number, user: JwtUser) {
    await this.assertOrg(orgId);

    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      const membership = await this.prisma.orgMember.findUnique({
        where: { userId_orgId: { userId: user.sub, orgId } },
      });
      if (!membership) {
        throw new ForbiddenException('No eres miembro de esta organización');
      }
    }

    return this.prisma.orgMember.findMany({
      where: { orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstname: true,
            lastname: true,
            handle: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Invita a un usuario por email a la organización. Solo OWNER o ADMIN+.
   * Genera token UUID con expiración de 72h y envía email vía Mailgun.
   */
  async inviteMember(orgId: number, dto: InviteMemberDto, user: JwtUser, req?: Request) {
    await this.assertOrg(orgId);
    await this.assertOwnerOrAdmin(orgId, user);

    // Verificar que el email no pertenece a un miembro ya existente
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      const isMember = await this.prisma.orgMember.findUnique({
        where: { userId_orgId: { userId: existing.id, orgId } },
      });
      if (isMember) {
        throw new ConflictException('Este usuario ya es miembro de la organización');
      }
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const invitation = await this.prisma.orgInvitation.create({
      data: { token, email: dto.email, orgId, expiresAt },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const inviteUrl = `${frontendUrl}/invitations/${token}`;

    const org = await this.prisma.user.findUnique({
      where: { id: orgId },
      select: { firstname: true },
    });

    try {
      await this.mail.sendOrgInvitation(dto.email, org?.firstname ?? 'Konbini', inviteUrl, 72);
    } catch (err) {
      this.logger.warn(`sendOrgInvitation falló para ${dto.email}: ${(err as Error).message}`);
    }

    this.audit.log({
      userId: user.sub,
      action: 'CREATE',
      entity: 'USER',
      entityId: orgId,
      metadata: { invitation: dto.email },
      req,
    });

    return { id: invitation.id, email: dto.email, expiresAt };
  }

  /**
   * Acepta una invitación por token. Crea OrgMember y elimina la invitación
   * en una transacción atómica.
   */
  async acceptInvitation(token: string, user: JwtUser, req?: Request) {
    const invitation = await this.prisma.orgInvitation.findUnique({ where: { token } });

    if (!invitation) {
      throw new UnauthorizedException('Invitación inválida');
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.orgInvitation.delete({ where: { id: invitation.id } });
      throw new UnauthorizedException('Invitación expirada');
    }

    // Verificar que el email del invitado coincide con el usuario autenticado
    const me = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { email: true },
    });

    if (me?.email !== invitation.email) {
      throw new ForbiddenException('Esta invitación es para otro email');
    }

    // Si ya es miembro, limpiar la invitación y devolver estado
    const alreadyMember = await this.prisma.orgMember.findUnique({
      where: { userId_orgId: { userId: user.sub, orgId: invitation.orgId } },
    });
    if (alreadyMember) {
      await this.prisma.orgInvitation.delete({ where: { id: invitation.id } });
      return { alreadyMember: true };
    }

    await this.prisma.$transaction([
      this.prisma.orgMember.create({
        data: { userId: user.sub, orgId: invitation.orgId, role: OrgRole.MEMBER },
      }),
      this.prisma.orgInvitation.delete({ where: { id: invitation.id } }),
    ]);

    this.audit.log({
      userId: user.sub,
      action: 'CREATE',
      entity: 'USER',
      entityId: invitation.orgId,
      metadata: { acceptedInvitation: invitation.id },
      req,
    });

    return { orgId: invitation.orgId, role: 'MEMBER' };
  }

  /**
   * Cambia el rol de un miembro. Solo OWNER o ADMIN+.
   * No se puede degradar al único OWNER.
   */
  async changeMemberRole(orgId: number, memberUserId: number, dto: UpdateMemberRoleDto, user: JwtUser, req?: Request) {
    await this.assertOrg(orgId);
    await this.assertOwnerOrAdmin(orgId, user);

    const member = await this.prisma.orgMember.findUnique({
      where: { userId_orgId: { userId: memberUserId, orgId } },
    });
    if (!member) {
      throw new NotFoundException('Miembro no encontrado en esta organización');
    }

    if (member.role === OrgRole.OWNER && dto.role === OrgRole.MEMBER) {
      const ownerCount = await this.prisma.orgMember.count({
        where: { orgId, role: OrgRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('No puedes degradar al único OWNER de la organización');
      }
    }

    const updated = await this.prisma.orgMember.update({
      where: { userId_orgId: { userId: memberUserId, orgId } },
      data: { role: dto.role },
    });

    this.audit.log({
      userId: user.sub,
      action: 'UPDATE',
      entity: 'USER',
      entityId: orgId,
      metadata: { memberUserId, newRole: dto.role },
      req,
    });

    return updated;
  }

  /**
   * Elimina a un miembro de la organización. Solo OWNER o ADMIN+.
   * No se puede eliminar al único OWNER.
   */
  async removeMember(orgId: number, memberUserId: number, user: JwtUser, req?: Request) {
    await this.assertOrg(orgId);
    await this.assertOwnerOrAdmin(orgId, user);

    const member = await this.prisma.orgMember.findUnique({
      where: { userId_orgId: { userId: memberUserId, orgId } },
    });
    if (!member) {
      throw new NotFoundException('Miembro no encontrado en esta organización');
    }

    if (member.role === OrgRole.OWNER) {
      const ownerCount = await this.prisma.orgMember.count({
        where: { orgId, role: OrgRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('No puedes eliminar al único OWNER de la organización');
      }
    }

    await this.prisma.orgMember.delete({
      where: { userId_orgId: { userId: memberUserId, orgId } },
    });

    this.audit.log({
      userId: user.sub,
      action: 'DELETE',
      entity: 'USER',
      entityId: orgId,
      metadata: { memberUserId },
      req,
    });

    return { removed: true };
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
