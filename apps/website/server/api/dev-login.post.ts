export default defineEventHandler(async event => {
  try {
    const body = await readBody(event)
    const { username, password } = body

    // Validar que se proporcionen las credenciales
    if (!username || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Usuario y contraseña son requeridos',
      })
    }

    // Obtener credenciales del servidor (variables de entorno)
    const config = useRuntimeConfig()
    const devUsername = config.devUsername
    const devPassword = config.devPassword

    // Verificar credenciales
    if (username === devUsername && password === devPassword) {
      // Generar un token de sesión seguro
      const sessionToken = generateSessionToken()

      // Devolver respuesta exitosa
      return {
        success: true,
        message: 'Autenticación exitosa',
        sessionToken,
      }
    } else {
      throw createError({
        statusCode: 401,
        statusMessage: 'Credenciales incorrectas',
      })
    }
  } catch (error) {
    console.error('Error en dev-login:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Error interno del servidor',
    })
  }
})

// Función para generar un token de sesión seguro
function generateSessionToken(): string {
  return crypto.randomUUID()
}
