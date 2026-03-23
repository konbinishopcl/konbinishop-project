module.exports = {
  apps: [
    {
      name: 'konbinishop-listing', // Cambia esto al nombre de tu aplicación
      script: './.output/server/index.mjs', // El punto de entrada para tu aplicación Nuxt
      instances: 'max', // Usar múltiples instancias
      exec_mode: 'cluster', // Ejecutar en modo clúster
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
