import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type JwtUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrgContext } from '../common/org-context/org-context.decorator';
import type { OrgContextDto } from '../common/org-context/org-context.types';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificaciones del usuario o de la org (X-Org-Context)' })
  @ApiResponse({ status: 200, description: 'Listado paginado' })
  list(
    @Query() query: QueryNotificationsDto,
    @CurrentUser() user: JwtUser,
    @OrgContext() orgContext: OrgContextDto | null,
  ) {
    return this.notifications.listMine(query, user, orgContext);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Contar notificaciones no leídas del usuario o de la org' })
  @ApiResponse({ status: 200, description: '{ count: number }' })
  unreadCount(
    @CurrentUser() user: JwtUser,
    @OrgContext() orgContext: OrgContextDto | null,
  ) {
    return this.notifications.unreadCount(user, orgContext);
  }

  /**
   * CRÍTICO: @Patch('read-all') DEBE declararse ANTES de @Patch(':id/read')
   * para que NestJS no intente parsear "read-all" como :id (ParseIntPipe fallaría con 400).
   */
  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas las notificaciones del recipient como leídas' })
  @ApiResponse({ status: 200, description: '{ updated: number }' })
  markAllRead(
    @CurrentUser() user: JwtUser,
    @OrgContext() orgContext: OrgContextDto | null,
  ) {
    return this.notifications.markAllRead(user, orgContext);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar una notificación específica como leída' })
  @ApiResponse({ status: 200, description: 'Notificación actualizada' })
  @ApiResponse({ status: 404, description: 'No encontrada o no pertenece al caller' })
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
    @OrgContext() orgContext: OrgContextDto | null,
  ) {
    return this.notifications.markRead(id, user, orgContext);
  }
}
