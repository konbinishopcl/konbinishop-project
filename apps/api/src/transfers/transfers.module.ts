import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailgunModule } from '../../services/mailgun/mailgun.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TransfersService } from './transfers.service';
import { TransfersController, AdminTransfersController } from './transfers.controller';

@Module({
  imports: [AuthModule, MailgunModule, AuditModule, NotificationsModule],
  controllers: [TransfersController, AdminTransfersController],
  providers: [TransfersService],
})
export class TransfersModule {}
