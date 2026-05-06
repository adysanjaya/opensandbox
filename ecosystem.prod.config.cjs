const fs = require('fs');
const path = require('path');

const cwd = __dirname;

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split('\n').forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

// Load environment files
loadEnv(path.join(cwd, 'apps/api/.env'));
loadEnv(path.join(cwd, 'apps/web/.env.local'));

module.exports = {
  apps: [
    {
      name: 'sandbox-api',
      cwd: path.join(cwd, 'apps/api'),
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
      },
      error_file: path.join(cwd, 'logs/api-error.log'),
      out_file: path.join(cwd, 'logs/api-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
    },
    {
      name: 'sandbox-web',
      cwd: path.join(cwd, 'apps/web'),
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
        API_URL: process.env.API_URL || 'http://localhost:4000',
      },
      error_file: path.join(cwd, 'logs/web-error.log'),
      out_file: path.join(cwd, 'logs/web-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      time: true,
    },
  ],
};
