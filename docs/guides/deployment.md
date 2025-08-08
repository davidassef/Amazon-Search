# Deployment Guide

**Description:** Comprehensive deployment strategies and configurations for the Amazon Product Scraper across various platforms, from simple static deployments to enterprise-scale cloud infrastructure.

**Last Updated:** January 2025

---

## Table of Contents

- [Overview](#-overview)
- [Quick Deployment Options](#-quick-deployment-options)
- [Pre-deployment Checklist](#-pre-deployment-checklist)
- [Production Build Process](#-production-build-process)
- [Docker Deployment](#-docker-deployment)
- [Cloud Platform Deployments](#-cloud-platform-deployments)
- [CDN and Static Hosting](#-cdn-and-static-hosting)
- [Security Configuration](#-security-configuration)
- [Monitoring and Logging](#-monitoring-and-logging)
- [Continuous Deployment](#-continuous-deployment)
- [Troubleshooting Common Issues](#-troubleshooting-common-issues)
- [Performance Optimization](#-performance-optimization)

---

## 📋 Overview

This guide covers comprehensive deployment strategies for the Amazon Product Scraper, including development, staging, and production environments across various platforms and hosting providers.

---

## 🚀 Quick Deployment Options

### Option 1: Simple Static + API Deployment

**Best for**: Small-scale deployments, demos, personal projects

```bash
# Build frontend
cd frontend
bun run build

# Deploy frontend to Netlify/Vercel
# Deploy backend to Railway/Render
```

### Option 2: Containerized Deployment

**Best for**: Production environments, scalability, consistency

```bash
# Build and run with Docker
docker-compose up -d
```

### Option 3: Cloud Platform Deployment

**Best for**: Enterprise, high availability, managed services

- **AWS**: Elastic Beanstalk + S3 + CloudFront
- **Google Cloud**: App Engine + Cloud Storage
- **Azure**: App Service + Blob Storage

---

## 🔧 Pre-deployment Checklist

### Environment Preparation

```bash
# ✅ Required tasks before deployment
□ Environment variables configured
□ Dependencies installed and updated
□ Tests passing (frontend and backend)
□ Build process verified
□ Performance optimizations applied
□ Security configurations reviewed
□ Domain and SSL certificates ready
□ Monitoring and logging setup
□ Backup and recovery plan created
```

### Build Verification

```bash
# Frontend build test
cd frontend
bun run build
bun run preview  # Test production build

# Backend test
cd backend
NODE_ENV=production bun start

# Integration test
curl http://localhost:3000/api/health
```

---

## 🏭 Production Build Process

### Frontend Build

#### Build Configuration

```javascript
// frontend/vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    target: 'es2015',
    minify: 'esbuild',
    sourcemap: false, // Set to true for debugging
    
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['i18next', 'i18next-browser-languagedetector']
        },
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name.split('.').pop();
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    }
  },
  
  // Production optimizations
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});
```

#### Build Commands

```bash
cd frontend

# Install dependencies
bun install

# Run production build
NODE_ENV=production bun run build

# Verify build
ls -la dist/
du -sh dist/  # Check build size

# Test production build locally
bun run preview
```

### Backend Preparation

#### Production Environment Variables

```bash
# backend/.env.production
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# CORS configuration
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com

# Rate limiting
MAX_REQUESTS_PER_MINUTE=100
RATE_LIMIT_WINDOW=60000

# Request timeouts
REQUEST_TIMEOUT=15000
MAX_RETRIES=5

# Security
TRUST_PROXY=true

# Logging
LOG_LEVEL=warn
ENABLE_REQUEST_LOGGING=false
```

#### Production Optimization

```javascript
// backend/server.js
const express = require('express');
const path = require('path');

const app = express();

// Production optimizations
if (process.env.NODE_ENV === 'production') {
  // Trust proxy for correct client IP
  app.set('trust proxy', true);
  
  // Serve static files
  app.use(express.static(path.join(__dirname, '../frontend/dist'), {
    maxAge: '1y',
    etag: false
  }));
  
  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Error handling for production
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  } else {
    res.status(500).json({ 
      success: false, 
      error: err.message,
      stack: err.stack
    });
  }
});
```

---

## 🐳 Docker Deployment

### Dockerfile Configuration

#### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM oven/bun:1-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bun -u 1001

# Change ownership
RUN chown -R bun:nodejs /app
USER bun

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun --version || exit 1

# Start application
CMD ["bun", "start"]
```

#### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM oven/bun:1-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - CORS_ORIGIN=http://localhost:80
    volumes:
      - ./backend/.env.production:/app/.env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Redis for caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

#### Deployment Commands

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Update services
docker-compose pull
docker-compose up -d --no-deps

# Scale backend
docker-compose up -d --scale backend=3

# Stop services
docker-compose down

# Clean up
docker-compose down -v --rmi all
```

---

## ☁️ Cloud Platform Deployments

### AWS Deployment

#### Elastic Beanstalk + S3

```bash
# Install AWS CLI and EB CLI
npm install -g @aws-amplify/cli
pip install awsebcli

# Initialize Elastic Beanstalk
eb init amazon-scraper --region us-east-1 --platform "Node.js"

# Create environment
eb create production --instance-type t3.micro --platform-version "Node.js 18"

# Deploy backend
eb deploy

# Build and deploy frontend to S3
cd frontend
bun run build
aws s3 sync dist/ s3://your-bucket-name --delete
```

#### Configuration Files

```yaml
# .ebextensions/01_nginx.config
files:
  "/etc/nginx/conf.d/proxy.conf":
    mode: "000644"
    owner: root
    group: root
    content: |
      upstream backend {
          server 127.0.0.1:8081;
      }
      
      server {
          listen 80;
          
          location /api {
              proxy_pass http://backend;
              proxy_set_header Host $host;
              proxy_set_header X-Real-IP $remote_addr;
              proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
              proxy_set_header X-Forwarded-Proto $scheme;
          }
          
          location / {
              try_files $uri $uri/ /index.html;
          }
      }

# .ebextensions/02_environment.config
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PORT: 8081
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
    NodeVersion: "18.19.0"
```

### Vercel Deployment

#### Vercel Configuration

```json
{
  "version": 2,
  "name": "amazon-scraper",
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/frontend/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

#### Deployment Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add NODE_ENV production
vercel env add CORS_ORIGIN https://your-app.vercel.app
```

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy backend
railway up backend/

# Deploy frontend
railway up frontend/

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
```

### Render Deployment

#### render.yaml

```yaml
services:
  - type: web
    name: amazon-scraper-backend
    env: node
    buildCommand: cd backend && bun install
    startCommand: cd backend && bun start
    plan: free
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000

  - type: web
    name: amazon-scraper-frontend
    env: static
    buildCommand: cd frontend && bun install && bun run build
    staticPublishPath: ./frontend/dist
    plan: free
```

---

## 🌐 CDN and Static Hosting

### Netlify Deployment

```bash
# Build frontend
cd frontend
bun run build

# Deploy to Netlify
npx netlify-cli deploy --prod --dir=dist
```

#### netlify.toml

```toml
[build]
  base = "frontend"
  publish = "dist"
  command = "bun run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend.railway.app/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Cloudflare Pages

```bash
# Connect Git repository to Cloudflare Pages
# Configure build settings:
# Build command: cd frontend && bun run build
# Build output directory: frontend/dist
# Root directory: /
```

---

## 🔒 Security Configuration

### SSL/TLS Certificate

#### Let's Encrypt with Nginx

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Nginx Configuration

```nginx
# /etc/nginx/sites-available/amazon-scraper
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend
    location / {
        root /var/www/amazon-scraper;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://your-domain.com";
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }
}
```

### Environment Security

```bash
# Create secure environment file
sudo install -m 600 /dev/null /etc/amazon-scraper/environment

# Add environment variables
echo "NODE_ENV=production" >> /etc/amazon-scraper/environment
echo "API_SECRET=$(openssl rand -hex 32)" >> /etc/amazon-scraper/environment

# Load in systemd service
# Environment=EnvironmentFile=/etc/amazon-scraper/environment
```

---

## 📊 Monitoring and Logging

### Application Monitoring

#### PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'amazon-scraper-backend',
    script: './backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# Setup startup
pm2 startup
pm2 save
```

#### Health Check Endpoint Enhancement

```javascript
// backend/routes/health.js
const os = require('os');
const process = require('process');

app.get('/api/health', async (req, res) => {
  const healthcheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(os.totalmem() / 1024 / 1024) + 'MB'
      },
      cpu: {
        count: os.cpus().length,
        loadAverage: os.loadavg()
      }
    },
    
    services: {
      amazon: await checkAmazonAccess(),
      cache: await checkCacheConnection()
    }
  };

  res.json(healthcheck);
});

async function checkAmazonAccess() {
  try {
    const response = await axios.get('https://www.amazon.com', { timeout: 5000 });
    return { status: 'accessible', responseTime: response.duration };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
}
```

### Logging Configuration

```javascript
// backend/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'amazon-scraper' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

---

## 🔄 Continuous Deployment

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
          
      - name: Install dependencies
        run: |
          cd frontend && bun install
          cd ../backend && bun install
          
      - name: Run tests
        run: |
          cd frontend && bun test
          # cd backend && bun test  # When Jest/Bun is fixed

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
          
      - name: Build frontend
        run: |
          cd frontend
          bun install
          bun run build
          
      - name: Deploy to S3
        run: |
          aws s3 sync frontend/dist/ s3://${{ secrets.S3_BUCKET }} --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          
      - name: Deploy backend
        run: |
          # Deploy to your backend hosting service
          # This depends on your hosting provider
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

test:
  stage: test
  image: node:$NODE_VERSION
  before_script:
    - npm install -g bun
  script:
    - cd frontend && bun install && bun test
    - cd ../backend && bun install
    # - bun test  # When available
  artifacts:
    reports:
      coverage: frontend/coverage/
    expire_in: 1 week

build:
  stage: build
  image: node:$NODE_VERSION
  before_script:
    - npm install -g bun
  script:
    - cd frontend && bun install && bun run build
  artifacts:
    paths:
      - frontend/dist/
    expire_in: 1 hour

deploy_production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
  script:
    - curl -X POST $WEBHOOK_URL -H "Content-Type: application/json" -d '{"deploy": true}'
  only:
    - main
```

---

## 🚨 Troubleshooting Common Issues

### Build Issues

#### Frontend Build Failures

```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules bun.lockb
bun install
bun run build

# Check for TypeScript errors
bunx tsc --noEmit

# Check for ESLint issues
bunx eslint src/
```

#### Backend Issues

```bash
# Memory issues
NODE_OPTIONS="--max-old-space-size=4096" bun start

# Port conflicts
lsof -ti:3000 | xargs kill -9
```

### Deployment Issues

#### DNS and SSL

```bash
# Check DNS propagation
nslookup your-domain.com
dig your-domain.com

# Test SSL certificate
curl -vI https://your-domain.com

# Check certificate expiration
openssl s_client -connect your-domain.com:443 -servername your-domain.com 2>/dev/null | openssl x509 -noout -dates
```

#### Performance Issues

```bash
# Monitor resource usage
htop
iotop
netstat -tulpn

# Check application logs
tail -f /var/log/amazon-scraper/combined.log
pm2 logs amazon-scraper-backend
```

### Recovery Procedures

#### Database Backup (if applicable)

```bash
# Backup user data
pg_dump -h localhost -U postgres amazon_scraper > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -h localhost -U postgres amazon_scraper < backup_20250107_120000.sql
```

#### Application Recovery

```bash
# Rollback deployment
git log --oneline -10  # Find last good commit
git reset --hard <commit-hash>
pm2 restart amazon-scraper-backend

# Emergency maintenance mode
echo "Maintenance in progress" > /var/www/amazon-scraper/maintenance.html
# Configure nginx to serve maintenance page
```

---

## 📈 Performance Optimization

### Caching Strategies

#### Redis Configuration

```javascript
// backend/config/redis.js
const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('Redis server connection refused');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Redis retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// Cache middleware
const cache = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      res.sendResponse = res.json;
      res.json = (body) => {
        client.setex(key, duration, JSON.stringify(body));
        res.sendResponse(body);
      };
      
      next();
    } catch (error) {
      next(); // Continue without cache on error
    }
  };
};

module.exports = { client, cache };
```

### CDN Configuration

#### CloudFlare Settings

```javascript
// Frontend caching headers
app.use('/assets', express.static('dist/assets', {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, path) => {
    res.set({
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Service-Worker-Allowed': '/'
    });
  }
}));
```

---

---

## 🔗 Related Documentation

- **Previous:** [Configuration Guide](../getting-started/configuration.md)
- **Next:** [Architecture Overview](../development/architecture-overview.md)
- **Related:** [Contributing Guide](../development/contributing.md) | [Performance Optimizations](../../frontend/PERFORMANCE_OPTIMIZATIONS.md)

---

This comprehensive deployment guide covers all major deployment scenarios and best practices for the Amazon Product Scraper application. Choose the deployment method that best fits your requirements, budget, and technical constraints.

*For additional support, refer to the [Contributing Guide](../development/contributing.md) and [System Architecture](../development/architecture-overview.md) documentation.*
