import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [AuthModule], // provee JwtAuthGuard
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService], // 11-02 lo importa desde events/spots/heroes/orgs/transfers
})
export class NotificationsModule {}
