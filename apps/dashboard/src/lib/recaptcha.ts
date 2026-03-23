const RECAPTCHA_SECRET = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;
const PROTECTED_METHODS = ['POST', 'PUT', 'DELETE'];

export async function validateRecaptchaToken(
  token: string | null,
  method: string
): Promise<void> {
  if (!PROTECTED_METHODS.includes(method.toUpperCase())) return;

  // Dev bypass: when secret key is not configured, skip validation with a warning.
  // This allows the proxy to work without breaking existing forms that don't yet
  // send x-recaptcha-token. Set GOOGLE_RECAPTCHA_SECRET_KEY in production to enforce.
  // WARNING: Do NOT set GOOGLE_RECAPTCHA_SECRET_KEY in production until all dashboard
  // forms are updated to send reCAPTCHA tokens (form-event.tsx is wired in Task 3,
  // remaining forms in a follow-on phase).
  if (!RECAPTCHA_SECRET) {
    console.warn('[recaptcha] GOOGLE_RECAPTCHA_SECRET_KEY not set, skipping validation');
    return;
  }

  if (!token) {
    throw new Error('reCAPTCHA token required');
  }

  const result = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: RECAPTCHA_SECRET,
      response: token,
    }),
  }).then(r => r.json());

  if (!result.success || result.score <= 0.5) {
    throw new Error('reCAPTCHA verification failed');
  }
}
