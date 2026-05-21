module.exports = {
  apps: [
    {
      name: 'konbini-api',
      script: 'dist/src/main.js',
      cwd: '/home/forge/konbini/apps/api',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3333,
      },
      error_file: '/home/forge/.pm2/logs/konbini-api-error.log',
      out_file: '/home/forge/.pm2/logs/konbini-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
