import {
  verifyRecaptchaToken,
  isRecaptchaProtectedRoute,
} from '../utils/recaptcha'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const apiUrl = process.env.API_URL || 'http://localhost:1337'

  // Get the path after /api/
  const fullPath = event.node.req.url?.replace('/api/', '') || ''

  // reCAPTCHA validation for protected routes (POST/PUT/DELETE)
  if (isRecaptchaProtectedRoute(fullPath, event.method ?? '')) {
    const recaptchaToken = getHeader(event, 'x-recaptcha-token')
    await verifyRecaptchaToken(
      recaptchaToken,
      config.recaptchaSecretKey as string,
    )
  }

  // Build the target URL
  const targetUrl = `${apiUrl}/api/${fullPath}`

  // Forward only whitelisted headers
  const headers: Record<string, string> = {}

  const authHeader = getHeader(event, 'authorization')
  if (authHeader) {
    headers['Authorization'] = authHeader
  }

  const contentType = getHeader(event, 'content-type')
  if (contentType) {
    headers['Content-Type'] = contentType
  }

  const cookie = getHeader(event, 'cookie')
  if (cookie) {
    headers['Cookie'] = cookie
  }

  // Forward the request to Strapi
  return proxyRequest(event, targetUrl, { headers })
})
