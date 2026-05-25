import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgContextGuard } from '../common/org-context/org-context.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';
import { OrgContext } from '../common/org-context/org-context.decorator';
import type { OrgContextDto } from '../common/org-context/org-context.types';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { QuerySubscriptionsDto } from './dto/query-subscriptions.dto';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, OrgContextGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * Inicia el flujo de suscripción. Crea una Order especial con item type=SUBSCRIPTION
   * y devuelve la redirectUrl de Transbank. La Subscription row se crea en /confirm.
   * Lanza 409 si ya existe una suscripción ACTIVE.
   */
  @Post()
  @ApiOperation({ summary: 'Iniciar suscripción — genera Order y devuelve redirectUrl de Transbank' })
  @ApiResponse({ status: 201, description: 'redirectUrl y externalId para redirigir al usuario' })
  @ApiResponse({ status: 409, description: 'Ya existe una suscripción activa' })
  create(
    @CurrentUser() user: JwtUser,
    @OrgContext() orgContext: OrgContextDto | null,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(user, orgContext, dto);
  }

  /**
   * Devuelve el estado de la suscripción del usuario/org actual.
   * Si no hay suscripción, devuelve { active: false }.
   */
  @Get('me')
  @ApiOperation({ summary: 'Estado de la suscripción del usuario o de la org (X-Org-Context)' })
  @ApiResponse({ status: 200, description: '{ active: false } o datos completos del ciclo y créditos' })
  findMine(
    @CurrentUser() user: JwtUser,
    @OrgContext() orgContext: OrgContextDto | null,
  ) {
    return this.subscriptionsService.findMine(user, orgContext);
  }

  /**
   * Cancela la suscripción. Marca cancelledAt y status=CANCELLED.
   * El ciclo sigue vigente hasta cycleEnd (D-09).
   */
  @Delete('me')
  @ApiOperation({ summary: 'Cancelar suscripción — marca cancelledAt, sigue vigente hasta cycleEnd' })
  @ApiResponse({ status: 200, description: 'Suscripción marcada como cancelada' })
  @ApiResponse({ status: 400, description: 'La suscripción ya está cancelada' })
  @ApiResponse({ status: 404, description: 'No tienes una suscripción activa' })
  cancelMine(
    @CurrentUser() user: JwtUser,
    @OrgContext() orgContext: OrgContextDto | null,
  ) {
    return this.subscriptionsService.cancelMine(user, orgContext);
  }

  /**
   * Lista paginada de todas las suscripciones. Solo ADMIN y SUPER_ADMIN.
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN' as Role, 'SUPER_ADMIN' as Role)
  @ApiOperation({ summary: 'Listar todas las suscripciones — solo ADMIN/SUPER_ADMIN, paginado' })
  @ApiResponse({ status: 200, description: 'Lista paginada de suscripciones con datos de usuario/org' })
  @ApiResponse({ status: 403, description: 'Requiere rol ADMIN o SUPER_ADMIN' })
  findAll(@Query() query: QuerySubscriptionsDto) {
    return this.subscriptionsService.findAll(query);
  }
}
