import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ServicesService } from './services.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { CreateServiceOptionDto } from './dto/create-service-option.dto';
import { UpdateServiceOptionDto } from './dto/update-service-option.dto';
import { QueryServiceRequestsDto } from './dto/query-service-requests.dto';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  @Post('photography')
  @ApiOperation({ summary: 'Solicitar cotización de fotografía (público)' })
  createPhotography(@Body() dto: CreateServiceRequestDto) {
    return this.services.createRequest(dto, ServiceType.PHOTOGRAPHY);
  }

  @Post('content-creators')
  @ApiOperation({ summary: 'Solicitar cotización de creadores de contenido (público)' })
  createContent(@Body() dto: CreateServiceRequestDto) {
    return this.services.createRequest(dto, ServiceType.CONTENT);
  }

  @Get('photography/options')
  @ApiOperation({ summary: 'Opciones activas de fotografía (público)' })
  listPhotographyOptions() {
    return this.services.getActiveOptions(ServiceType.PHOTOGRAPHY);
  }

  @Get('content-creators/options')
  @ApiOperation({ summary: 'Opciones activas de creadores (público)' })
  listContentOptions() {
    return this.services.getActiveOptions(ServiceType.CONTENT);
  }

  @Get('photography')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar solicitudes de fotografía (ADMIN+)' })
  listPhotographyRequests(@Query() query: QueryServiceRequestsDto) {
    return this.services.listRequests(ServiceType.PHOTOGRAPHY, query);
  }

  @Get('content-creators')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar solicitudes de creadores (ADMIN+)' })
  listContentRequests(@Query() query: QueryServiceRequestsDto) {
    return this.services.listRequests(ServiceType.CONTENT, query);
  }

  @Post('photography/options')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear opción de fotografía (ADMIN+)' })
  createPhotographyOption(@Body() dto: CreateServiceOptionDto) {
    return this.services.createOption(dto, ServiceType.PHOTOGRAPHY);
  }

  @Patch('photography/options/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar opción de fotografía (ADMIN+)' })
  updatePhotographyOption(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceOptionDto) {
    return this.services.updateOption(id, dto);
  }

  @Delete('photography/options/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar opción de fotografía (soft-delete si tiene requests) (ADMIN+)' })
  deletePhotographyOption(@Param('id', ParseIntPipe) id: number) {
    return this.services.deleteOption(id);
  }

  @Post('content-creators/options')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear opción de creadores (ADMIN+)' })
  createContentOption(@Body() dto: CreateServiceOptionDto) {
    return this.services.createOption(dto, ServiceType.CONTENT);
  }

  @Patch('content-creators/options/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar opción de creadores (ADMIN+)' })
  updateContentOption(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceOptionDto) {
    return this.services.updateOption(id, dto);
  }

  @Delete('content-creators/options/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar opción de creadores (soft-delete si tiene requests) (ADMIN+)' })
  deleteContentOption(@Param('id', ParseIntPipe) id: number) {
    return this.services.deleteOption(id);
  }
}
