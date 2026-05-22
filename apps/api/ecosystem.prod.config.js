module.exports = {
  apps: [
    {
      name: 'konbini-prod',
      script: 'npm',
      args: 'run start:prod',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
