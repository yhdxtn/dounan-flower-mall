module.exports = {
  apps: [
    {
      name: 'dounan-api',
      cwd: '/opt/dounan-flower-mall/backend',
      script: 'src/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/opt/dounan-flower-mall/logs/api-error.log',
      out_file: '/opt/dounan-flower-mall/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
