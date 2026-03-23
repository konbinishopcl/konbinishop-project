export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },

  // NUEVO: Configuración de logging
  logger: {
    level: 'info',
    requests: true,
  },

  // Configuración de Winston para logging a archivos
  winston: {
    transports: [
      {
        type: 'file',
        filename: 'logs/strapi.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        level: 'info',
      },
    ],
  },
});
