module.exports = {
  apps: [
    {
      name:        'sistema-market-nube',
      script:      'server.js',
      instances:   'max',   // cluster mode en el VPS
      exec_mode:   'cluster',
      autorestart: true,
      watch:       false,
      env: {
        NODE_ENV: 'production',
        PORT:     5000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file:  'logs/err.log',
      out_file:    'logs/out.log',
    },
  ],
}
