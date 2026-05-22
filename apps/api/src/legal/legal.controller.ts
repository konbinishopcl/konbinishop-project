import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LegalDocumentType } from '@prisma/client';
import { LegalService } from './legal.service';
import { UpsertLegalDto } from './dto/upsert-legal.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legal: LegalService) {}

  // ── Lectura pública ──

  @Get('terms-of-service')
  @ApiOperation({ summary: 'Obtener términos y condiciones vigentes (público)' })
  getTerms() {
    return this.legal.findOne(LegalDocumentType.TERMS_OF_SERVICE);
  }

  @Get('privacy-policy')
  @ApiOperation({ summary: 'Obtener política de privacidad vigente (público)' })
  getPrivacy() {
    return this.legal.findOne(LegalDocumentType.PRIVACY_POLICY);
  }

  // ── Escritura (ADMIN+) ──

  @Put('terms-of-service')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear o actualizar términos y condiciones (ADMIN+)' })
  upsertTerms(@Body() dto: UpsertLegalDto) {
    return this.legal.upsert(LegalDocumentType.TERMS_OF_SERVICE, dto);
  }

  @Put('privacy-policy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear o actualizar política de privacidad (ADMIN+)' })
  upsertPrivacy(@Body() dto: UpsertLegalDto) {
    return this.legal.upsert(LegalDocumentType.PRIVACY_POLICY, dto);
  }

  @Delete('terms-of-service')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar términos y condiciones (ADMIN+)' })
  deleteTerms() {
    return this.legal.remove(LegalDocumentType.TERMS_OF_SERVICE);
  }

  @Delete('privacy-policy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar política de privacidad (ADMIN+)' })
  deletePrivacy() {
    return this.legal.remove(LegalDocumentType.PRIVACY_POLICY);
  }
}
