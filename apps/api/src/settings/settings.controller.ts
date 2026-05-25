import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UpsertSettingDto } from './dto/upsert-setting.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  // CRÍTICO: 'public' antes de los endpoints admin para que sea verdaderamente sin auth.
  // No tiene @UseGuards.
  @Get('public')
  @ApiOperation({ summary: 'Settings públicas (SPOT_* y HERO_*) — sin autenticación' })
  @ApiResponse({ status: 200, description: 'Mapa {key: value}' })
  getPublic() {
    return this.settings.getPublic();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todas las settings (ADMIN+)' })
  @ApiResponse({ status: 200, description: 'Array de {key, value, updatedAt}' })
  getAll() {
    return this.settings.getAll();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upsert de una setting (ADMIN+)' })
  @ApiResponse({ status: 200, description: 'Setting actualizado' })
  upsert(@Body() dto: UpsertSettingDto) {
    return this.settings.set(dto.key, dto.value);
  }
}
