import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LegalDocumentType } from '@prisma/client';
import { LegalService } from './legal.service';
import { UpsertLegalDto } from './dto/upsert-legal.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('privacy')
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly legal: LegalService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener política de privacidad vigente (público)' })
  get() {
    return this.legal.findOne(LegalDocumentType.PRIVACY_POLICY);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear o actualizar política de privacidad (ADMIN+)' })
  upsert(@Body() dto: UpsertLegalDto) {
    return this.legal.upsert(LegalDocumentType.PRIVACY_POLICY, dto);
  }

  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar política de privacidad (ADMIN+)' })
  remove() {
    return this.legal.remove(LegalDocumentType.PRIVACY_POLICY);
  }
}
