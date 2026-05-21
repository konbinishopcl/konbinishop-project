import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('subscribers')
@Controller('subscribers')
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Post()
  @ApiOperation({ summary: 'Suscribirse al newsletter (público)' })
  @ApiResponse({ status: 201, description: 'Suscrito exitosamente', schema: { example: { ok: true } } })
  @ApiResponse({ status: 409, description: 'Email ya suscrito' })
  subscribe(@Body() dto: SubscribeDto) {
    return this.newsletter.subscribe(dto.email);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Listar suscriptores (ADMIN+)' })
  @ApiResponse({ status: 200, description: 'Lista de suscriptores', schema: { example: [{ id: 1, email: 'hola@ejemplo.com', createdAt: '2026-05-21T00:00:00.000Z' }] } })
  findAll() {
    return this.newsletter.findAll();
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Eliminar suscriptor (ADMIN+)' })
  @ApiResponse({ status: 200, description: 'Eliminado', schema: { example: { deleted: true } } })
  @ApiResponse({ status: 404, description: 'Suscriptor no encontrado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.newsletter.remove(id);
  }
}
