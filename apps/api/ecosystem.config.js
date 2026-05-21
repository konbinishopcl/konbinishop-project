module.exports = {
  apps: [
    {
      name: 'konbini-api',
      script: 'dist/src/main.js',
      cwd: '/home/forge/tu-dominio.cl/current',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
