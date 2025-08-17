#!/bin/bash

# AWS IP Middleware Proxy Deployment Script

set -e

# Configuration
APP_DIR="/opt/betting-proxy"
APP_USER="betting-proxy"
SERVICE_NAME="betting-proxy"
BACKUP_DIR="/opt/betting-proxy/backups"

echo "🚀 Starting AWS IP Proxy deployment..."

# Create backup of current deployment
if [ -d "$APP_DIR/current" ]; then
    echo "📦 Creating backup of current deployment..."
    mkdir -p $BACKUP_DIR
    cp -r $APP_DIR/current $BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)
fi

# Stop existing service
echo "🛑 Stopping existing service..."
pm2 stop $SERVICE_NAME || true

# Create new deployment directory
echo "📁 Creating deployment directory..."
mkdir -p $APP_DIR/releases/$(date +%Y%m%d-%H%M%S)
RELEASE_DIR="$APP_DIR/releases/$(date +%Y%m%d-%H%M%S)"

# Copy application files
echo "📋 Copying application files..."
cp -r /tmp/betting-backend/* $RELEASE_DIR/

# Install dependencies
echo "📦 Installing dependencies..."
cd $RELEASE_DIR
npm ci --only=production

# Set up configuration
echo "⚙️ Setting up configuration..."
cp $APP_DIR/config/proxy-config.json $RELEASE_DIR/
cp $APP_DIR/config/.env $RELEASE_DIR/

# Set permissions
echo "🔐 Setting permissions..."
chown -R $APP_USER:$APP_USER $RELEASE_DIR

# Update symlink
echo "🔗 Updating current symlink..."
rm -f $APP_DIR/current
ln -s $RELEASE_DIR $APP_DIR/current

# Start service with PM2
echo "🚀 Starting service..."
cd $APP_DIR/current
sudo -u $APP_USER pm2 start externalapi/index.js \
  --name $SERVICE_NAME \
  --instances 2 \
  --exec-mode cluster \
  --max-memory-restart 512M \
  --log /var/log/betting-proxy/app.log \
  --error /var/log/betting-proxy/error.log \
  --out /var/log/betting-proxy/out.log

# Save PM2 configuration
sudo -u $APP_USER pm2 save
sudo -u $APP_USER pm2 startup

# Health check
echo "🏥 Performing health check..."
sleep 10
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/proxy/health)

if [ "$HEALTH_CHECK" = "200" ]; then
    echo "✅ Deployment successful! Health check passed."
    
    # Clean up old releases (keep last 5)
    echo "🧹 Cleaning up old releases..."
    cd $APP_DIR/releases
    ls -t | tail -n +6 | xargs rm -rf
    
else
    echo "❌ Deployment failed! Health check returned: $HEALTH_CHECK"
    
    # Rollback
    echo "🔄 Rolling back to previous version..."
    if [ -d "$BACKUP_DIR/backup-latest" ]; then
        rm -f $APP_DIR/current
        ln -s $BACKUP_DIR/backup-latest $APP_DIR/current
        sudo -u $APP_USER pm2 restart $SERVICE_NAME
    fi
    
    exit 1
fi

echo "🎉 Deployment completed successfully!"