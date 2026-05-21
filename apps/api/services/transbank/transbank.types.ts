// Tipos propios de la API de Transbank WebPay Plus.
// No contienen lógica de negocio — solo modelan los contratos HTTP del servicio externo.

export interface TbkCreateTransactionRequest {
  buy_order: string   // ID único de la orden (máx. 26 chars)
  session_id: string  // ID de sesión del usuario (máx. 61 chars)
  amount: number      // Monto en pesos CLP (entero)
  return_url: string  // URL a la que Transbank redirige al usuario tras el pago
}

export interface TbkCreateTransactionResponse {
  token: string // Token de la transacción — se pasa a Transbank en la URL de pago
  url: string   // URL base de pago de Transbank (sin el token)
}

export interface TbkCardDetail {
  card_number: string // Últimos 4 dígitos de la tarjeta
}

export interface TbkConfirmTransactionResponse {
  vci: string                  // Resultado de la autenticación VCI
  amount: number
  status: string               // 'AUTHORIZED' | 'FAILED' | 'NULLIFIED' | etc.
  buy_order: string
  session_id: string
  card_detail: TbkCardDetail
  accounting_date: string
  transaction_date: string
  authorization_code: string
  payment_type_code: string
  response_code: number        // 0 = aprobado; cualquier otro = rechazado
  installments_number: number
}

export interface TbkErrorResponse {
  error_message: string
}
