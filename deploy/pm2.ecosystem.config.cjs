module.exports = {
  apps: [
    {
      name: 'dounan-api',
      cwd: 'D:/github/dounan-flower-mall/backend',
      script: 'src/server.js',
      interpreter: 'D:/dev/node/node.exe',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: 'D:/github/dounan-flower-mall/logs/api-error.log',
      out_file: 'D:/github/dounan-flower-mall/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss'
    }
  ]
};
