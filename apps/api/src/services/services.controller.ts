import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ServiceType } from '@prisma/client';
import { ServicesService } from './services.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';

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
}
