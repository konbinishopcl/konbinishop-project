module.exports = {
  apps: [
    {
      name: "konbinishop-api",
      script: "npm",
      args: "start",
      env_file: ".env",
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      max_memory_restart: "1G",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      ignore_watch: ["node_modules", "logs"],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: "10s"
    },
  ],
};
