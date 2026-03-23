import { createError } from 'h3'

const RECAPTCHA_PROTECTED_METHODS = ['POST', 'PUT', 'DELETE']

/**
 * Verifies a reCAPTCHA v3 token against Google's siteverify API.
 * Throws createError(400) if token is missing, invalid, or score <= 0.5.
 *
 * Dev bypass: when secretKey is not configured, logs a warning and returns
 * early. This allows the proxy to work without breaking existing forms that
 * do not yet send x-recaptcha-token. Set RECAPTCHA_SECRET_KEY in production.
 */
export async function verifyRecaptchaToken(
  token: string | null | undefined,
  secretKey: string,
): Promise<void> {
  // Dev bypass: when secret key is not configured, skip validation with a warning.
  // This allows the proxy to work without breaking existing forms that don't yet
  // send x-recaptcha-token. Set RECAPTCHA_SECRET_KEY in production to enforce.
  if (!secretKey || !secretKey.trim()) {
    console.warn('[recaptcha] RECAPTCHA_SECRET_KEY not set — skipping validation. Set it in production.')
    return
  }

  if (!token || !token.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'reCAPTCHA token is required',
    })
  }

  const result = await $fetch<{
    success: boolean
    score: number
    'error-codes'?: string[]
  }>('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    body: new URLSearchParams({
      secret: secretKey,
      response: token,
    }).toString(),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  if (!result.success || result.score <= 0.5) {
    console.warn(
      `[recaptcha] Verification failed. success=${result.success}, score=${result.score ?? 'n/a'}, error-codes=${(result['error-codes'] ?? []).join(',')}`,
    )
    throw createError({
      statusCode: 400,
      statusMessage: 'reCAPTCHA verification failed. Please try again.',
    })
  }
}

export function isRecaptchaProtectedRoute(
  _fullPath: string,
  method: string,
): boolean {
  return RECAPTCHA_PROTECTED_METHODS.includes(method.toUpperCase())
}
