import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [AuthModule], // provee JwtAuthGuard + RolesGuard
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService], // Spots/Heroes lo importan
})
export class SettingsModule {}
