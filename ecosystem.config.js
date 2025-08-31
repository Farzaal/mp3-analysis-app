module.exports = {
  apps: [
    {
      name: 'We-Oversee-APIs',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'cluster',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      out_file: '/var/www/pm2-out.log',
      error_file: '/var/www/pm2-error.log',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
    },
  ],
};
