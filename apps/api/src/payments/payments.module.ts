import { Module } from '@nestjs/common';
import { TransbankModule } from '../../services/transbank/transbank.module';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GatewayFactory } from './gateway.factory';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AuthModule, TransbankModule, SubscriptionsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, GatewayFactory],
})
export class PaymentsModule {}
