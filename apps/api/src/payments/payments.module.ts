import { Module } from '@nestjs/common';
import { TransbankModule } from '../../services/transbank/transbank.module';
import { AuthModule } from '../auth/auth.module';
import { GatewayFactory } from './gateway.factory';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AuthModule, TransbankModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, GatewayFactory],
})
export class PaymentsModule {}
