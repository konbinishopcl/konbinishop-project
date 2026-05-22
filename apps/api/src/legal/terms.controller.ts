import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LegalDocumentType } from '@prisma/client';
import { LegalService } from './legal.service';
import { UpsertLegalDto } from './dto/upsert-legal.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('terms')
@Controller('terms')
export class TermsController {
  constructor(private readonly legal: LegalService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener términos y condiciones vigentes (público)' })
  get() {
    return this.legal.findOne(LegalDocumentType.TERMS_OF_SERVICE);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear o actualizar términos y condiciones (ADMIN+)' })
  upsert(@Body() dto: UpsertLegalDto) {
    return this.legal.upsert(LegalDocumentType.TERMS_OF_SERVICE, dto);
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar términos y condiciones (ADMIN+)' })
  remove() {
    return this.legal.remove(LegalDocumentType.TERMS_OF_SERVICE);
  }
}
