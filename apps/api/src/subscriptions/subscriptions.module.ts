import { Module } from '@nestjs/common';
import { TransbankModule } from '../../services/transbank/transbank.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';
import { GatewayFactory } from '../payments/gateway.factory';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [AuthModule, TransbankModule, SettingsModule, NotificationsModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, GatewayFactory],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
