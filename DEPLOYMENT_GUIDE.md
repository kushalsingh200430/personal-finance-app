# Pocket Guard Deployment Guide

Complete guide to deploy Pocket Guard on various hosting platforms.

## Quick Comparison

| Platform | Cost | Setup Time | Complexity | Best For |
|----------|------|-----------|-----------|----------|
| **Vercel + Railway** | Free tier available | 15 mins | Very Easy | Quick MVP, startups |
| **Heroku** | $7-50/month | 20 mins | Easy | Rapid deployment |
| **AWS** | Pay-as-you-go | 30-45 mins | Medium | Scalability, production |
| **DigitalOcean** | $5+/month | 25 mins | Medium | Developers, affordable |
| **Render** | Free tier available | 20 mins | Easy | Simple apps, free tier |
| **Netlify + Backend** | Free frontend | 20 mins | Easy | Frontend, Netlify Functions |
| **Docker + VPS** | $5-20/month | 30 mins | Medium | Full control |

---

## Option 1: Vercel + Railway (⭐ RECOMMENDED FOR MVP)

**Best for**: Quick launch, free tier, minimal setup

### Frontend Deployment (Vercel)

**Step 1: Create Vercel Account**
```bash
# Go to vercel.com
# Sign up with GitHub account
# Import your personal-finance-app repository
```

**Step 2: Configure Frontend**
```bash
cd frontend

# Create .env.production
REACT_APP_API_URL=https://your-backend-url/api
REACT_APP_ENV=production
```

**Step 3: Deploy**
```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys on push
# Frontend URL: https://your-app.vercel.app
```

### Backend Deployment (Railway)

**Step 1: Create Railway Account**
```bash
# Go to railway.app
# Sign up with GitHub
```

**Step 2: Create PostgreSQL Database**
```bash
# In Railway dashboard:
# Click "New" → Select "PostgreSQL"
# Configure: pocket_guard_db
# Copy DATABASE_URL
```

**Step 3: Deploy Backend**
```bash
# Create railway.json in backend folder:
{
  "builder": "nixpacks",
  "buildCommand": "npm install && npm run build",
  "startCommand": "npm start",
  "nixpacks": {
    "providers": ["nodejs-npm", "postgres"]
  }
}

# Push to GitHub:
git push origin main

# In Railway dashboard:
# Click "New" → "GitHub Repo"
# Select your personal-finance-app repository
# Railway auto-deploys on push
```

**Step 4: Environment Variables in Railway**
```
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your_secret_key_32_chars
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=app_password
GOVERNMENT_API_KEY=test_key
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-app.vercel.app
```

**Step 5: Update Frontend**
```bash
# In frontend/.env.production:
REACT_APP_API_URL=https://your-railway-backend.up.railway.app/api
```

**Costs:**
- Vercel: Free (5GB bandwidth/month)
- Railway: Free tier (512MB RAM, $5/month after credits)
- **Total: Free to $5/month**

---

## Option 2: Heroku (Easy, Established)

### Requirements
- Heroku account (heroku.com)
- Heroku CLI installed

### Setup

**Step 1: Create Heroku Apps**
```bash
heroku login
heroku create pocket-guard-frontend
heroku create pocket-guard-backend
```

**Step 2: Add PostgreSQL**
```bash
heroku addons:create heroku-postgresql:hobby-dev \
  -a pocket-guard-backend
```

**Step 3: Set Environment Variables**
```bash
heroku config:set \
  JWT_SECRET=your_secret_key \
  TWILIO_ACCOUNT_SID=your_sid \
  -a pocket-guard-backend

# Verify:
heroku config -a pocket-guard-backend
```

**Step 4: Deploy Backend**
```bash
cd backend

# Create Procfile:
echo "web: npm start" > Procfile

# Create runtime.txt:
echo "node-18.x" > runtime.txt

# Deploy:
git push heroku main

# Run migrations:
heroku run "node -e \"require('./server.ts')\"" \
  -a pocket-guard-backend
```

**Step 5: Build and Deploy Frontend**
```bash
cd frontend

# Create Procfile:
echo "web: serve -s build -l 3000" > Procfile

# Deploy:
git push heroku main
```

**Step 6: Configure Frontend Environment**
```bash
heroku config:set \
  REACT_APP_API_URL=https://pocket-guard-backend.herokuapp.com/api \
  -a pocket-guard-frontend
```

**Costs:**
- Free tier suspended (Oct 2022)
- Eco: $5/month per app
- **Total: $10+/month**

---

## Option 3: AWS (Professional Grade)

### Services Used
- **EC2**: Application server
- **RDS**: PostgreSQL database
- **Route53**: Domain management
- **CloudFront**: CDN for frontend
- **S3**: Static file storage

### Architecture

```
Domain (Route53)
    ↓
CloudFront (CDN)
    ↓
S3 (Frontend) + EC2 (Backend API)
    ↓
RDS (PostgreSQL)
```

### Deployment Steps

**Step 1: Create EC2 Instance**
```bash
# AWS Console → EC2 → Launch Instance
# Select: Ubuntu 22.04 LTS
# Instance type: t3.micro (eligible for free tier)
# Security group: Allow HTTP (80), HTTPS (443), SSH (22)
```

**Step 2: Connect and Setup Backend**
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Clone repository
cd /home/ubuntu
git clone https://github.com/yourusername/personal-finance-app.git
cd personal-finance-app/backend

# Install dependencies
npm install

# Create .env
nano .env
# Paste environment variables
```

**Step 3: Create RDS Database**
```bash
# AWS Console → RDS → Create database
# Engine: PostgreSQL 14
# DB instance: db.t3.micro
# Storage: 20 GB
# Credentials: pocket_guard_user / strong_password

# Get endpoint: pocket-guard-db.xxxxx.us-east-1.rds.amazonaws.com

# In .env:
DATABASE_URL=postgresql://pocket_guard_user:password@pocket-guard-db.xxxxx.us-east-1.rds.amazonaws.com:5432/pocket_guard_db
```

**Step 4: Run Database Migrations**
```bash
psql -h pocket-guard-db.xxxxx.us-east-1.rds.amazonaws.com \
     -U pocket_guard_user \
     -d postgres

# Create database:
CREATE DATABASE pocket_guard_db;

# Run migrations:
\c pocket_guard_db
\i /home/ubuntu/personal-finance-app/database/migrations/001_create_users.sql
\i /home/ubuntu/personal-finance-app/database/migrations/002_create_otp.sql
# ... run all migrations
```

**Step 5: Setup PM2 for Process Management**
```bash
sudo npm install -g pm2

# Start backend
cd /home/ubuntu/personal-finance-app/backend
pm2 start server.ts --name "pocket-guard-api"
pm2 save
pm2 startup

# Check status:
pm2 status
pm2 logs pocket-guard-api
```

**Step 6: Configure Nginx**
```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/pocket-guard

# Paste:
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3000;
    }
}

# Enable site:
sudo ln -s /etc/nginx/sites-available/pocket-guard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Step 7: Deploy Frontend to S3**
```bash
cd frontend

# Build
npm run build

# Install AWS CLI
sudo apt install -y awscli

# Create S3 bucket
aws s3 mb s3://pocket-guard-frontend

# Upload build
aws s3 sync build/ s3://pocket-guard-frontend --delete

# Make public:
# AWS Console → S3 → Bucket → Block Public Access (Off)
# Add bucket policy
```

**Step 8: SSL Certificate (Let's Encrypt)**
```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot certonly --nginx -d your-domain.com

# Auto-renew:
sudo systemctl enable certbot.timer
```

**Costs:**
- EC2: $0-10/month (free tier first year)
- RDS: $15/month
- S3: $0-1/month
- Route53: $0.50/month
- **Total: $15-25/month**

---

## Option 4: DigitalOcean App Platform (Best Value)

### Features
- Easy deployment
- PostgreSQL included
- Custom domains
- Automatic HTTPS
- $5-12/month

### Deployment

**Step 1: Create DigitalOcean Account**
```bash
# Go to digitalocean.com
# Create new App Platform app
```

**Step 2: Connect GitHub**
```
New App → GitHub → Select repository → Select branch
```

**Step 3: Configure Services**

**Backend Service**
```
Service type: Web Service
Source: backend folder
Build command: npm install && npm run build
Run command: npm start
Environment:
  - NODE_ENV=production
  - JWT_SECRET=your_secret
  - PORT=8080
```

**Database Service**
```
Type: PostgreSQL
Version: 14
Cluster size: Basic ($15/month)
```

**Frontend Service**
```
Service type: Static Site
Source: frontend folder
Build command: npm install && npm run build
Output directory: build
```

**Step 4: Set Environment Variables**
```
DATABASE_URL=<auto-populated from PostgreSQL>
JWT_SECRET=your_secret_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
EMAIL_USER=your_email
EMAIL_PASSWORD=app_password
FRONTEND_URL=https://your-app.ondigitalocean.app
```

**Step 5: Deploy**
```
Click "Create Resources"
Wait for deployment (5-10 mins)
Access at: https://your-app.ondigitalocean.app
```

**Costs:**
- App Platform: $12/month minimum
- PostgreSQL: $15/month
- **Total: $27/month**

---

## Option 5: Render (Free Tier Available)

### Features
- Generous free tier
- Auto-deploy from GitHub
- PostgreSQL included
- Easy setup

### Deployment

**Step 1: Connect GitHub**
```bash
# Go to render.com
# Click "New" → "Web Service"
# Connect GitHub repository
```

**Step 2: Backend Setup**
```
Name: pocket-guard-backend
Environment: Node
Build Command: npm install && npm run build
Start Command: npm start

Environment Variables:
NODE_ENV=production
JWT_SECRET=your_secret
DATABASE_URL=<from PostgreSQL>
```

**Step 3: Database Setup**
```
New → PostgreSQL
Name: pocket-guard-db
PostgreSQL Version: 14
Copy connection string
```

**Step 4: Frontend Setup**
```
New → Static Site
Connect GitHub
Build Command: npm run build
Publish Directory: build
```

**Costs:**
- Backend: Free (0.1 CPU)
- Frontend: Free
- PostgreSQL: $7/month (with free tier limited)
- **Total: Free to $7/month**

---

## Option 6: Docker + Self-Hosted VPS

### Best VPS Providers
- **DigitalOcean**: $4-6/month
- **Linode**: $5/month
- **Vultr**: $2.50/month
- **Hetzner**: €3/month

### Deployment

**Step 1: Setup VPS**
```bash
# SSH into VPS
ssh root@your-vps-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

**Step 2: Clone and Deploy**
```bash
cd /opt
git clone https://github.com/yourusername/personal-finance-app.git
cd personal-finance-app

# Create .env
nano .env
# Add all environment variables

# Start containers
docker-compose up -d

# Check status
docker-compose logs -f
```

**Step 3: Nginx Reverse Proxy**
```bash
# Install Nginx
sudo apt install -y nginx

# Configure (see AWS section for nginx config)

# Get SSL certificate
sudo certbot certonly --nginx -d your-domain.com
```

**Costs:**
- VPS: $2.50-6/month
- Domain: $10-12/year
- **Total: $2.50-6/month**

---

## Domain Registration

### Where to Buy Domains
- **Namecheap**: $0.88/year (first year)
- **GoDaddy**: $1.99/year
- **Google Domains**: $12/year
- **Cloudflare**: $8.40/year (supports DNSSEC)
- **Hostinger**: $2.99/year

### Setup Steps

**Step 1: Register Domain**
```
Example: pocketguard.com (₹200-500/year in India)
```

**Step 2: Point to Hosting**

**For Vercel:**
```
DNS Settings:
CNAME: your-app.vercel.app
```

**For Railway/Heroku:**
```
CNAME: your-app.herokuapp.com
```

**For AWS:**
```
Route53 → Create record:
Type: A record
Alias: your-elb-address
```

**For Custom VPS:**
```
A Record: your.vps.ip.address
```

---

## Recommended Setup for Startups

### Architecture
```
Domain (Namecheap) → Cloudflare (DNS)
         ↓
    Vercel (Frontend)
         ↓
    Railway (Backend + PostgreSQL)
```

### Setup Cost
- **Domain**: $10/year
- **Frontend**: Free (Vercel)
- **Backend**: $5/month (Railway)
- **Total**: ~$70/year ($5.83/month)

### Setup Time: 30 minutes

**Steps:**
1. Create GitHub repository
2. Sign up for Vercel, Railway, Namecheap
3. Deploy frontend to Vercel
4. Deploy backend to Railway
5. Add PostgreSQL to Railway
6. Configure environment variables
7. Point domain to services
8. Test and launch!

---

## Production Checklist

- [ ] HTTPS/SSL certificate configured
- [ ] Environment variables secured
- [ ] Database backups enabled
- [ ] Monitoring and alerts setup
- [ ] Error logging configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Input validation on all endpoints
- [ ] Database indexed
- [ ] CDN for static assets
- [ ] Email service verified
- [ ] SMS service (Twilio) tested
- [ ] Payment gateway ready (for future)
- [ ] Analytics setup
- [ ] Status page created
- [ ] Disaster recovery plan

---

## Scaling Strategy

### Phase 1: MVP Launch
- Railway/Vercel (Free-$5/month)
- 1 Backend instance
- Shared PostgreSQL

### Phase 2: Growth (1,000+ users)
- AWS or DigitalOcean
- 2-3 Backend instances
- RDS with multi-AZ
- CloudFront CDN
- ElastiCache for sessions

### Phase 3: Scale (10,000+ users)
- Kubernetes (AWS EKS / DigitalOcean)
- Auto-scaling
- Database replication
- Global CDN
- Microservices architecture

---

## Post-Launch

### Week 1
- Monitor error logs
- Fix critical bugs
- Optimize database queries
- Test payment flow

### Month 1
- Gather user feedback
- Improve UI/UX
- Add analytics
- Optimize performance

### Quarter 1
- Plan feature roadmap
- Set up A/B testing
- Implement marketing
- Plan fundraising (if applicable)

---

## Troubleshooting Common Issues

### Backend not responding
```bash
# Check logs
pm2 logs pocket-guard-api

# Check process
pm2 status

# Check network
sudo netstat -tulpn | grep 3001

# Check database connection
psql $DATABASE_URL
```

### Database connection error
```bash
# Test connection
psql -h your-host -U user -d dbname

# Check security groups (AWS)
# Check firewall rules (VPS)
```

### Frontend not building
```bash
cd frontend
npm cache clean --force
rm package-lock.json
npm install
npm run build
```

### Domain not resolving
```bash
# Check DNS propagation
dig your-domain.com
nslookup your-domain.com

# Wait 24-48 hours for full propagation
```

---

## Support

- Vercel Docs: vercel.com/docs
- Railway Docs: railway.app/docs
- AWS Free Tier: aws.amazon.com/free
- DigitalOcean Docs: docs.digitalocean.com
- Docker Docs: docs.docker.com

---

**Ready to launch? Choose your platform above and get Pocket Guard online! 🚀**

Next steps:
1. Choose hosting platform
2. Register domain
3. Set up environment variables
4. Deploy applications
5. Configure monitoring
6. Launch!

Good luck! 🎉
