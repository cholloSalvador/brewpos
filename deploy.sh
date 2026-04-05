#!/bin/bash
# ============================================
# BrewPOS VPS Deployment Script
# Run this on your Ubuntu 22.04 VPS as root
# ============================================

set -e

echo "=========================================="
echo "  BrewPOS - VPS Deployment"
echo "=========================================="

# 1. Update system
echo "[1/8] Updating system..."
apt update && apt upgrade -y

# 2. Install Node.js 20
echo "[2/8] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Install PostgreSQL
echo "[3/8] Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# 4. Setup PostgreSQL database
echo "[4/8] Setting up database..."
DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
echo "Generated DB password: $DB_PASSWORD"

sudo -u postgres psql <<EOF
CREATE USER brewpos WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE brewpos OWNER brewpos;
GRANT ALL PRIVILEGES ON DATABASE brewpos TO brewpos;
EOF

echo "Database created successfully!"

# 5. Install Nginx
echo "[5/8] Installing Nginx..."
apt install -y nginx
systemctl enable nginx

# 6. Install PM2
echo "[6/8] Installing PM2..."
npm install -g pm2

# 7. Setup app directory
echo "[7/8] Setting up app directory..."
mkdir -p /var/www/brewpos

echo ""
echo "=========================================="
echo "  System setup complete!"
echo "=========================================="
echo ""
echo "Your database credentials:"
echo "  DATABASE_URL=postgresql://brewpos:${DB_PASSWORD}@localhost:5432/brewpos"
echo ""
echo "Next steps:"
echo "  1. Upload your app to /var/www/brewpos"
echo "  2. Create /var/www/brewpos/.env with:"
echo "     DATABASE_URL=\"postgresql://brewpos:${DB_PASSWORD}@localhost:5432/brewpos\""
echo "     JWT_SECRET=\"$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64)\""
echo "     NODE_ENV=\"production\""
echo ""
echo "  3. Then run:"
echo "     cd /var/www/brewpos"
echo "     npm install"
echo "     npx prisma migrate deploy"
echo "     npx tsx prisma/seed.ts"
echo "     npm run build"
echo "     pm2 start ecosystem.config.js"
echo "     pm2 save"
echo "     pm2 startup"
echo ""
echo "  4. Setup Nginx:"
echo "     cp nginx.conf /etc/nginx/sites-available/brewpos"
echo "     ln -s /etc/nginx/sites-available/brewpos /etc/nginx/sites-enabled/"
echo "     rm /etc/nginx/sites-enabled/default"
echo "     nginx -t && systemctl restart nginx"
echo ""
echo "  5. (Optional) SSL with Let's Encrypt:"
echo "     apt install certbot python3-certbot-nginx"
echo "     certbot --nginx -d yourdomain.com"
echo ""
echo "=========================================="
