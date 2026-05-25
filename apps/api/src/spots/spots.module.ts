import { Module } from '@nestjs/common';
import { SpotsController } from './spots.controller';
import { SpotsService } from './spots.service';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthModule, AuditModule, NotificationsModule], // provides JwtAuthGuard + AuditService + NotificationsService
  controllers: [SpotsController],
  providers: [SpotsService],
})
export class SpotsModule {}
