# Deployment & Setup Documentation

## Overview

This guide provides comprehensive instructions for setting up, deploying, and maintaining the Inventory POS application in development, staging, and production environments.

## Prerequisites

### System Requirements

**Development Environment:**
- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)
- Web browser with developer tools

**Production Environment:**
- PostgreSQL 14+ database
- Node.js 18+ runtime
- SSL certificate (for HTTPS)
- Email service (Resend or SMTP)
- File storage service (Supabase Storage)

### Required Accounts & Services

1. **Database**: Supabase (PostgreSQL hosting)
2. **Email Service**: Resend or SMTP provider
3. **File Storage**: Supabase Storage
4. **Deployment**: Vercel (recommended) or similar platform
5. **Domain**: Custom domain (optional but recommended)

## Environment Configuration

### Environment Variables

Create `.env.local` file in the project root:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"
DIRECT_URL="postgresql://username:password@host:port/database"

# NextAuth.js Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email Configuration
EMAIL_PROVIDER="resend" # or "nodemailer"
RESEND_API_KEY="re_xxxxxxxxxx"

# Alternative SMTP Configuration (if using nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# File Storage Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Application Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Inventory POS"
COMPANY_NAME="Your Company Name"
SUPPORT_EMAIL="support@yourcompany.com"

# Security Configuration
ENCRYPTION_KEY="your-32-character-encryption-key"
RATE_LIMIT_ENABLED="true"

# Optional: Redis for caching (production recommended)
REDIS_URL="redis://localhost:6379"

# Optional: WordPress Integration
WORDPRESS_URL="https://yourstore.com"
WORDPRESS_API_KEY="your-wordpress-api-key"

# Development Tools
NODE_ENV="development"
LOG_LEVEL="debug"
```

### Environment Variable Descriptions

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_URL` | Application base URL | ✅ |
| `NEXTAUTH_SECRET` | Secret for JWT signing | ✅ |
| `RESEND_API_KEY` | Resend email service API key | ✅* |
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase public API key | ✅ |
| `ENCRYPTION_KEY` | 32-character encryption key | ✅ |
| `REDIS_URL` | Redis connection string | ❌ |

*Either `RESEND_API_KEY` or SMTP configuration is required.

## Local Development Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd inventory-pos
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Using Supabase (Recommended)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your database connection string from Project Settings > Database
3. Copy the connection string to `DATABASE_URL` in your `.env.local`

#### Local PostgreSQL (Alternative)

```bash
# Install PostgreSQL
brew install postgresql  # macOS
# or
sudo apt install postgresql  # Ubuntu

# Create database
createdb inventory_pos

# Update .env.local with local connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/inventory_pos"
```

### 4. Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Optional: Seed with test data
npm run seed:test-data
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 6. Verify Setup

1. Open `http://localhost:3000`
2. Register a new account
3. Check email for verification (check logs if using development email)
4. Navigate through the application to verify functionality

## Production Deployment

### Vercel Deployment (Recommended)

#### 1. Prepare for Deployment

```bash
# Ensure all dependencies are correct
npm install

# Run production build test
npm run build

# Run tests
npm test
```

#### 2. Deploy to Vercel

**Option A: Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts to configure project
```

**Option B: GitHub Integration**

1. Push code to GitHub repository
2. Connect repository to Vercel at [vercel.com](https://vercel.com)
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on git push

#### 3. Configure Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add all production environment variables:

```bash
# Production Database
DATABASE_URL=postgresql://prod-user:password@prod-host:5432/prod_db
DIRECT_URL=postgresql://prod-user:password@prod-host:5432/prod_db

# Production URLs
NEXTAUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Production secrets (generate new ones)
NEXTAUTH_SECRET=production-secret-key
ENCRYPTION_KEY=production-encryption-key

# Email service
RESEND_API_KEY=re_production_key

# File storage
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-key

# Production configuration
NODE_ENV=production
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
```

#### 4. Configure Build Command

In `vercel.json`:

```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm ci",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Alternative: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### 2. Build and Run Container

```bash
# Build image
docker build -t inventory-pos .

# Run container
docker run -p 3000:3000 --env-file .env.local inventory-pos
```

### Custom Server Deployment

#### 1. Server Setup

```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone and setup application
git clone <repository-url>
cd inventory-pos
npm ci
npx prisma generate
npm run build
```

#### 2. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'inventory-pos',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

#### 3. Start Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

## Database Setup & Migration

### Production Database Setup

#### 1. Supabase Setup

1. Create production Supabase project
2. Configure database settings:
   - Enable Row Level Security (RLS)
   - Set up connection pooling
   - Configure backups

3. Set up environment variables:
```bash
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

#### 2. Schema Migration

```bash
# Generate migration
npx prisma migrate dev --name init

# Apply to production
npx prisma migrate deploy

# Generate client
npx prisma generate
```

#### 3. Seed Production Data

```bash
# Create admin user and essential data
npm run seed:production
```

### Database Maintenance

#### Regular Backups

```bash
# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip > "backups/backup_$DATE.sql.gz"
find backups/ -name "*.sql.gz" -mtime +30 -delete
```

#### Performance Monitoring

```sql
-- Monitor slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check database size
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

## SSL/HTTPS Configuration

### Vercel (Automatic)

Vercel automatically provides SSL certificates for all deployments.

### Custom Domain with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Nginx Configuration

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring & Logging

### Application Monitoring

#### Health Check Endpoint

The application includes a health check endpoint:

```typescript
// /api/health
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "healthy",
    "email": "healthy",
    "storage": "healthy"
  }
}
```

#### Monitoring Script

```bash
#!/bin/bash
# health-check.sh

ENDPOINT="https://yourdomain.com/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $ENDPOINT)

if [ $RESPONSE -eq 200 ]; then
    echo "$(date): Health check passed"
else
    echo "$(date): Health check failed (HTTP $RESPONSE)"
    # Send alert email/notification
fi
```

### Logging Configuration

#### Production Logging

```typescript
// lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'inventory-pos' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.simple()
      })
    ] : [])
  ]
});
```

#### Log Rotation

```bash
# Install logrotate
sudo apt install logrotate

# Create logrotate configuration
sudo nano /etc/logrotate.d/inventory-pos
```

```
/path/to/app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nextjs nextjs
    postrotate
        pm2 reload inventory-pos
    endscript
}
```

## Security Configuration

### Security Headers

Next.js automatically applies many security headers. Additional configuration in `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

### Rate Limiting

Production rate limiting configuration:

```typescript
// lib/rate-limiting.ts
const rateLimits = {
  authentication: { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  registration: { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  api: { windowMs: 60 * 60 * 1000, maxRequests: 1000 }
};
```

### Firewall Configuration

```bash
# UFW firewall setup
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Backup & Recovery

### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_BACKUP="$BACKUP_DIR/db_$DATE.sql.gz"
FILES_BACKUP="$BACKUP_DIR/files_$DATE.tar.gz"

# Database backup
pg_dump $DATABASE_URL | gzip > $DB_BACKUP

# Files backup (if using local storage)
tar -czf $FILES_BACKUP /path/to/uploaded/files

# Upload to cloud storage (optional)
# aws s3 cp $DB_BACKUP s3://your-backup-bucket/
# aws s3 cp $FILES_BACKUP s3://your-backup-bucket/

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Recovery Procedure

```bash
# Database recovery
gunzip -c backup_20240115_120000.sql.gz | psql $DATABASE_URL

# Files recovery
tar -xzf files_20240115_120000.tar.gz -C /

# Restart application
pm2 restart inventory-pos
```

## Performance Optimization

### Database Optimization

```sql
-- Add performance indexes
CREATE INDEX CONCURRENTLY idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX CONCURRENTLY idx_sales_date_status ON sales_transactions (created_at, payment_status);
CREATE INDEX CONCURRENTLY idx_audit_logs_date_user ON audit_logs (created_at, user_id);

-- Analyze tables
ANALYZE products;
ANALYZE sales_transactions;
ANALYZE audit_logs;
```

### Application Optimization

```typescript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30 // 30 days
  }
};
```

### CDN Configuration

For Vercel deployments, CDN is automatic. For custom servers:

```bash
# Cloudflare configuration
# Set cache rules for static assets
# Enable Brotli compression
# Configure SSL/TLS settings
```

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Check connection string format
# Ensure database exists
# Verify network connectivity
```

#### Email Service Issues

```bash
# Test email configuration
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@yourdomain.com",
    "to": ["test@example.com"],
    "subject": "Test email",
    "html": "<strong>Test</strong>"
  }'
```

#### Build Issues

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules
npm install

# Check TypeScript errors
npx tsc --noEmit
```

### Debugging

#### Enable Debug Logging

```bash
# Development
DEBUG=* npm run dev

# Production
LOG_LEVEL=debug pm2 restart inventory-pos
```

#### Database Query Debugging

```typescript
// Enable Prisma query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

## Maintenance

### Regular Maintenance Tasks

#### Daily
- Monitor application health
- Check error logs
- Verify backup completion

#### Weekly  
- Review performance metrics
- Check disk space usage
- Update dependencies (development)

#### Monthly
- Security updates
- Database maintenance
- Performance optimization review
- Backup testing

### Update Procedure

```bash
# Development updates
git pull origin main
npm install
npx prisma generate
npm run build
npm test

# Production deployment
pm2 stop inventory-pos
git pull origin main
npm ci --only=production
npx prisma migrate deploy
npm run build
pm2 start inventory-pos
```

---

This deployment guide provides comprehensive instructions for setting up and maintaining the Inventory POS application in production environments with proper security, monitoring, and backup procedures.