import { Module } from '@nestjs/common';
import { HeroesController } from './heroes.controller';
import { HeroesService } from './heroes.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [AuthModule, AuditModule, NotificationsModule, SettingsModule], // provides JwtAuthGuard + AuditService + NotificationsService + SettingsService
  controllers: [HeroesController],
  providers: [HeroesService],
})
export class HeroesModule {}
