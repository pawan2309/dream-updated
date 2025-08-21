module.exports = {
  apps: [
    // Backend API Service
    {
      name: 'betting-backend',
      script: 'backend/externalapi/index.js',
      cwd: '/home/ubuntu/dream-updated',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4001,
        JWT_SECRET: 'your-jwt-secret-here'
      },
      error_file: '/home/ubuntu/dream-updated/logs/backend-error.log',
      out_file: '/home/ubuntu/dream-updated/logs/backend-out.log',
      log_file: '/home/ubuntu/dream-updated/logs/backend-combined.log',
      time: true
    },

    // User Management Frontend (port 3002)
    {
      name: 'user-management',
      script: 'npx',
      args: 'next start -p 3002',
      cwd: '/home/ubuntu/dream-updated/user-management/apps/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/home/ubuntu/dream-updated/logs/user-management-error.log',
      out_file: '/home/ubuntu/dream-updated/logs/user-management-out.log',
      log_file: '/home/ubuntu/dream-updated/logs/user-management-combined.log',
      time: true
    },

    // Operating Panel Frontend (port 3001)
    {
      name: 'operating-panel',
      script: 'npx',
      args: 'next start -p 3001',
      cwd: '/home/ubuntu/dream-updated/operating-panel/apps/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/home/ubuntu/dream-updated/logs/operating-panel-error.log',
      out_file: '/home/ubuntu/dream-updated/logs/operating-panel-out.log',
      log_file: '/home/ubuntu/dream-updated/logs/operating-panel-combined.log',
      time: true
    },

    // Client Panels Frontend (port 3000)
    {
      name: 'client-panels',
      script: 'npx',
      args: 'next start -p 3000',
      cwd: '/home/ubuntu/dream-updated/client_panels',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/home/ubuntu/dream-updated/logs/client-panels-error.log',
      out_file: '/home/ubuntu/dream-updated/logs/client-panels-out.log',
      log_file: '/home/ubuntu/dream-updated/logs/client-panels-combined.log',
      time: true
    }
  ]
};
