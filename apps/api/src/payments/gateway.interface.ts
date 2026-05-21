// Interfaz común que toda pasarela de pago debe implementar.
// Agregar una nueva pasarela = crear un servicio en services/<nombre>/ que implemente esta interfaz
// y registrarlo en GatewayFactory — sin tocar nada más del sistema.

export interface InitiatePaymentParams {
  orderId: number
  amount: number
  returnUrl: string  // URL a la que la pasarela redirige al usuario tras el pago
}

export interface InitiatePaymentResult {
  redirectUrl: string  // URL a la que el frontend redirige al usuario
  externalId: string   // Token o ID de transacción de la pasarela
}

export interface ConfirmPaymentResult {
  success: boolean
  externalId: string
  amount: number
  responseCode: number  // Código de respuesta de la pasarela (0 = éxito en Transbank)
}

export interface PaymentGateway {
  initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult>
  confirm(token: string): Promise<ConfirmPaymentResult>
}
