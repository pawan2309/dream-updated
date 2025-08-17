module.exports = {
  apps: [{
    name: 'betting-proxy',
    script: 'externalapi/index.js',
    cwd: '/opt/betting-proxy/current',
    instances: 2,
    exec_mode: 'cluster',
    
    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 4001
    },
    
    // Resources
    max_memory_restart: '512M',
    min_uptime: '10s',
    max_restarts: 10,
    
    // Logging
    log_file: '/var/log/betting-proxy/combined.log',
    out_file: '/var/log/betting-proxy/out.log',
    error_file: '/var/log/betting-proxy/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Monitoring
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    
    // Auto restart
    autorestart: true,
    
    // Graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Health monitoring
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true
  }],

  deploy: {
    production: {
      user: 'ec2-user',
      host: ['your-ec2-ip-1', 'your-ec2-ip-2'],
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/betting-backend.git',
      path: '/opt/betting-proxy',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci --only=production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};