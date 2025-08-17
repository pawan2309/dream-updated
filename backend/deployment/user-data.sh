#!/bin/bash

# Update system
yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install Redis
yum install -y redis
systemctl enable redis
systemctl start redis

# Configure Redis
echo "bind 0.0.0.0" >> /etc/redis.conf
echo "port 6380" >> /etc/redis.conf
echo "requirepass your-redis-password" >> /etc/redis.conf
systemctl restart redis

# Create application directory
mkdir -p /opt/betting-proxy
cd /opt/betting-proxy

# Create application user
useradd -r -s /bin/false betting-proxy
chown -R betting-proxy:betting-proxy /opt/betting-proxy

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Create log directory
mkdir -p /var/log/betting-proxy
chown betting-proxy:betting-proxy /var/log/betting-proxy

echo "Server setup completed"