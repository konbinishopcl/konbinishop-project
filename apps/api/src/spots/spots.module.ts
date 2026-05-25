import { Module } from '@nestjs/common';
import { SpotsController } from './spots.controller';
import { SpotsService } from './spots.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [AuthModule, AuditModule, NotificationsModule, SettingsModule], // provides JwtAuthGuard + AuditService + NotificationsService + SettingsService
  controllers: [SpotsController],
  providers: [SpotsService],
})
export class SpotsModule {}
