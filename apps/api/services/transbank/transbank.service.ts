import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PaymentGateway, InitiatePaymentParams, InitiatePaymentResult, ConfirmPaymentResult } from '../../src/payments/gateway.interface';
import type {
  TbkCreateTransactionRequest,
  TbkCreateTransactionResponse,
  TbkConfirmTransactionResponse,
} from './transbank.types';

// URLs de Transbank según entorno
const TBK_URLS = {
  sandbox: 'https://webpay3gint.transbank.cl',
  production: 'https://webpay3g.transbank.cl',
} as const;

const TBK_PATH = '/rswebpaytransaction/api/webpay/v1.2/transactions';

@Injectable()
export class TransbankService implements PaymentGateway {
  private readonly logger = new Logger(TransbankService.name);

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    const env = this.config.get<string>('TRANSBANK_ENV', 'sandbox');
    return env === 'production' ? TBK_URLS.production : TBK_URLS.sandbox;
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Tbk-Api-Key-Id': this.config.get<string>('TRANSBANK_COMMERCE_CODE', '597055555532'),
      'Tbk-Api-Key-Secret': this.config.get<string>(
        'TRANSBANK_API_SECRET',
        '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
      ),
    };
  }

  /** Crea una transacción en Transbank y devuelve la URL de pago. */
  async initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const body: TbkCreateTransactionRequest = {
      buy_order: `KNB-${params.orderId}`,
      session_id: `session-${params.orderId}-${Date.now()}`,
      amount: params.amount,
      return_url: params.returnUrl,
    };

    this.logger.debug(`Initiating Transbank transaction for order ${params.orderId}`);

    const response = await fetch(`${this.baseUrl}${TBK_PATH}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Transbank create transaction failed: ${error}`);
      throw new InternalServerErrorException('Error al crear la transacción en Transbank');
    }

    const data = (await response.json()) as TbkCreateTransactionResponse;

    return {
      redirectUrl: `${data.url}?token_ws=${data.token}`,
      externalId: data.token,
    };
  }

  /** Confirma una transacción usando el token devuelto por Transbank. */
  async confirm(token: string): Promise<ConfirmPaymentResult> {
    this.logger.debug(`Confirming Transbank transaction: ${token}`);

    const response = await fetch(`${this.baseUrl}${TBK_PATH}/${token}`, {
      method: 'PUT',
      headers: this.headers,
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Transbank confirm transaction failed: ${error}`);
      throw new InternalServerErrorException('Error al confirmar la transacción en Transbank');
    }

    const data = (await response.json()) as TbkConfirmTransactionResponse;

    return {
      success: data.response_code === 0,
      externalId: token,
      amount: data.amount,
      responseCode: data.response_code,
    };
  }
}
