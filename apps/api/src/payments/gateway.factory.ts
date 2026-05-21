import { BadRequestException, Injectable } from '@nestjs/common';
import { TransbankService } from '../../services/transbank/transbank.service';
import type { PaymentGateway } from './gateway.interface';
import { GatewayType } from './dto/checkout.dto';

@Injectable()
export class GatewayFactory {
  constructor(private readonly transbank: TransbankService) {}

  get(gateway: GatewayType): PaymentGateway {
    switch (gateway) {
      case GatewayType.TRANSBANK:
        return this.transbank;
      default:
        throw new BadRequestException(`Pasarela no soportada: ${gateway}`);
    }
  }
}
