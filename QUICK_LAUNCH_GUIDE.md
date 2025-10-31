# Pocket Guard - Quick Launch Guide (30 minutes)

Get Pocket Guard live with **Vercel + Railway** - The easiest way to launch!

## 📋 Prerequisites

- GitHub account (github.com)
- Vercel account (vercel.com) - Sign up with GitHub
- Railway account (railway.app) - Sign up with GitHub
- Domain (optional - free subdomain works too)

---

## ✅ Step 1: Prepare Your Code (5 mins)

### 1.1 Push to GitHub
```bash
# From your project root
cd /workspace/cmheq8nrf0003ocikzlnk5jpr/personal-finance-app

# Initialize git if needed
git init
git add .
git commit -m "Initial Pocket Guard setup"

# Create repository on GitHub (github.com/new)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/personal-finance-app.git
git branch -M main
git push -u origin main
```

### 1.2 Create Environment Files

**Frontend Environment** (`frontend/.env.production`)
```
REACT_APP_API_URL=https://pocket-guard-backend.up.railway.app/api
REACT_APP_ENV=production
```

**Backend Environment** (`backend/.env`)
```
NODE_ENV=production
PORT=3001
JWT_SECRET=generate_random_32_character_string_here
JWT_ACCESS_EXPIRY=30m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=https://pocket-guard-frontend.vercel.app

# Twilio (Optional - for SMS/OTP)
TWILIO_ACCOUNT_SID=optional_for_sms
TWILIO_AUTH_TOKEN=optional_for_sms
TWILIO_PHONE_NUMBER=optional_for_sms

# Email Service (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# Government APIs
GOVERNMENT_API_KEY=test_key_for_now
```

---

## 🚀 Step 2: Deploy Frontend on Vercel (5 mins)

### 2.1 Connect Repository to Vercel
```bash
# Go to vercel.com
# Click "New Project"
# Select "Import Git Repository"
# Choose "personal-finance-app"
```

### 2.2 Configure Vercel Project
```
Project Name: pocket-guard-frontend
Framework: React
Root Directory: ./frontend
Build Command: npm run build
Output Directory: build
```

### 2.3 Add Environment Variables
```
REACT_APP_API_URL=https://pocket-guard-backend.up.railway.app/api
REACT_APP_ENV=production
```

### 2.4 Deploy
```
Click "Deploy"
Wait 2-3 minutes
Your Frontend URL: https://pocket-guard-frontend.vercel.app
```

### ✅ Result
- Frontend live at: `https://pocket-guard-frontend.vercel.app`
- Auto-deploys on push to main branch

---

## 🗄️ Step 3: Deploy Backend on Railway (15 mins)

### 3.1 Create PostgreSQL Database

```bash
# Go to railway.app
# Click "New Project"
# Select "PostgreSQL"
# Configuration:
#   - Name: pocket-guard-db
#   - PostgreSQL Version: 14
```

### 3.2 Get Database URL
```bash
# Click on PostgreSQL service
# Go to "Connect" tab
# Copy the full PostgreSQL URL:
# postgresql://user:password@host:5432/pocket_guard_db

# Save this - you'll need it next
```

### 3.3 Deploy Backend Service

```bash
# In Railway Project
# Click "New Service" → "GitHub Repo"
# Select: personal-finance-app
```

### 3.4 Configure Backend Service

```
Service Name: pocket-guard-backend
Root Directory: ./backend
Build Command: npm install && npm run build
Start Command: npm start
```

### 3.5 Add Environment Variables to Backend

```
# In Railway dashboard, go to backend service
# Click "Variables" tab
# Add:

DATABASE_URL=postgresql://user:password@host:5432/pocket_guard_db
NODE_ENV=production
PORT=3001
JWT_SECRET=your_random_32_char_string_here
JWT_ACCESS_EXPIRY=30m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=https://pocket-guard-frontend.vercel.app
TWILIO_ACCOUNT_SID=optional
TWILIO_AUTH_TOKEN=optional
TWILIO_PHONE_NUMBER=optional
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
GOVERNMENT_API_KEY=test_key
```

### 3.6 Deploy
```
Click "Deploy"
Wait 5-10 minutes
Your Backend URL: https://pocket-guard-backend.up.railway.app
```

### ✅ Result
- Backend live at: `https://pocket-guard-backend.up.railway.app`
- Database connected and ready
- Auto-deploys on push to main branch

---

## 🗄️ Step 4: Run Database Migrations (3 mins)

### 4.1 Connect to Railway Database

```bash
# Get PostgreSQL connection string from Railway

# Option 1: Using psql CLI
psql postgresql://user:password@host:5432/pocket_guard_db

# Option 2: Using Railway CLI
railway login
railway connect pocket_guard_db
```

### 4.2 Run Migrations

```bash
# In Railway PostgreSQL connection, run each migration file:

# 1. Create Users Table
\i database/migrations/001_create_users.sql

# 2. Create OTP Table
\i database/migrations/002_create_otp.sql

# 3. Create Loans Table
\i database/migrations/003_create_loans.sql

# 4. Create Expenses Table
\i database/migrations/004_create_expenses.sql

# 5. Create Tax Data Table
\i database/migrations/005_create_tax_data.sql

# 6. Create PAN Verification Tables
\i database/migrations/006_add_pan_verification.sql

# Verify:
\dt

# Exit:
\q
```

### ✅ Result
- All tables created ✓
- Database ready for users ✓

---

## 🌐 Step 5: Update Frontend API URL (2 mins)

### 5.1 Get Backend URL
```
From Railway dashboard
Backend service → Settings → Service URL
Copy: https://pocket-guard-backend.up.railway.app
```

### 5.2 Update Frontend Environment
```bash
# In GitHub, edit file:
frontend/.env.production

# Change to:
REACT_APP_API_URL=https://pocket-guard-backend.up.railway.app/api
REACT_APP_ENV=production

# Commit and push:
git add frontend/.env.production
git commit -m "Update backend API URL"
git push origin main

# Vercel auto-redeployed within 1-2 mins
```

---

## ✅ Testing Your Deployment (3 mins)

### 5.1 Test Frontend
```bash
# Go to https://pocket-guard-frontend.vercel.app
# Should see home page with features
# Click "Sign Up" button
```

### 5.2 Test Backend Health
```bash
# Open browser
# Go to: https://pocket-guard-backend.up.railway.app/health

# Should see:
# { "status": "OK", "timestamp": "2024-10-31T..." }
```

### 5.3 Test Sign Up
```bash
# On frontend:
# 1. Go to /signup
# 2. Fill form:
#    Email: test@example.com
#    Password: TestPass123!
#    PAN: AAAPL5055K
#    First Name: John
#    Last Name: Doe
# 3. Click "Sign up"
# 4. Should see success or OTP verification screen
```

### 5.4 Check API Response
```bash
# Open browser console (F12)
# Go to Network tab
# Sign up and watch API call
# Should see request to backend API
```

---

## 🎉 You're Live!

### Your Pocket Guard Deployment
- **Frontend**: https://pocket-guard-frontend.vercel.app
- **Backend API**: https://pocket-guard-backend.up.railway.app
- **Database**: Connected on Railway PostgreSQL

### What's Running
✅ React frontend with full UI
✅ Express.js backend API
✅ PostgreSQL database
✅ Authentication system
✅ EMI calculator
✅ Expense tracker
✅ Tax filing system
✅ PAN verification

---

## 📱 Share Your App

### Tell People About Pocket Guard
```
Check out Pocket Guard - A complete personal finance management platform!

Frontend: https://pocket-guard-frontend.vercel.app
Built with React, Node.js, PostgreSQL

Features:
✅ EMI Calculator with amortization
✅ Expense tracking with categories
✅ Income tax filing (ITR-1)
✅ Two-factor authentication
✅ India-centric financial tools

#PersonalFinance #India #FinTech
```

---

## 🔧 Next Steps

### 1. Configure Twilio for SMS/OTP (Optional)
```bash
# Go to twilio.com
# Create account and verify
# Get: ACCOUNT_SID, AUTH_TOKEN, PHONE_NUMBER
# Update in Railway backend environment variables
```

### 2. Setup Email Service
```bash
# Gmail setup:
# 1. Enable 2-factor authentication
# 2. Create app password
# 3. Use app password in .env
```

### 3. Link Custom Domain (Optional)
```bash
# Buy domain (namecheap.com, godaddy.com, etc.)
# Point to Vercel frontend
# Point backend to Railway

# Vercel:
# Project Settings → Domains → Add domain

# Railway:
# Service Settings → Domains → Add domain
```

### 4. Monitor & Debug
```bash
# Vercel Dashboard
# View deployment logs
# Check error messages

# Railway Dashboard
# View backend logs
# Check database connections
# Monitor resource usage
```

---

## 📊 Monitoring

### View Frontend Logs (Vercel)
```
vercel.com → Dashboard → Select Project → Deployments → View Logs
```

### View Backend Logs (Railway)
```
railway.app → Project → Select Backend → Logs
```

### Check Database (Railway)
```
railway.app → Project → PostgreSQL → Data Browser
```

---

## 🐛 Troubleshooting

### Frontend shows 404
```
→ Check Vercel deployment status
→ View build logs for errors
→ Push code changes to trigger redeploy
```

### API returns 503
```
→ Check Railway backend status
→ View backend logs for errors
→ Verify DATABASE_URL is correct
```

### Database connection failed
```
→ Check PostgreSQL is running on Railway
→ Verify DATABASE_URL environment variable
→ Check IP whitelist/firewall rules
```

### Sign up returns error
```
→ Check backend logs
→ Verify all environment variables set
→ Check database migrations ran
→ Review browser console for error details
```

---

## 💰 Cost Breakdown

| Service | Free Tier | Cost |
|---------|-----------|------|
| Vercel Frontend | ✅ Yes | Free |
| Railway Backend | ✅ Yes | Free credits |
| Railway PostgreSQL | Limited | $7/month after free credits |
| Domain | - | $10-15/year |
| Twilio SMS | ✅ Yes | $0.0075 per SMS after free credits |
| **Total** | - | **~$7/month** |

💡 **First month free** with Railway credits!

---

## 📝 Important Notes

### Security
- Change JWT_SECRET to a random 32-character string
- Keep .env files private
- Enable HTTPS (automatic with Vercel & Railway)
- Use environment variables for sensitive data

### Performance
- Vercel handles frontend caching & CDN
- Railway auto-scales backend
- PostgreSQL indexed properly
- Monitor response times

### Backups
- Railway PostgreSQL auto-backups
- Enable automated backups in production
- Download backups regularly

---

## 🚀 Production Checklist

- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on Railway
- [ ] PostgreSQL database connected
- [ ] All migrations ran successfully
- [ ] Environment variables configured
- [ ] Health check endpoint responds (200)
- [ ] Sign up flow works end-to-end
- [ ] Twilio configured (for SMS)
- [ ] Email service configured
- [ ] Monitoring enabled
- [ ] Error logging setup
- [ ] Custom domain connected (optional)
- [ ] SSL/HTTPS working
- [ ] Rate limiting enabled
- [ ] CORS properly configured

---

## 📚 Resources

- **Vercel Docs**: vercel.com/docs
- **Railway Docs**: railway.app/docs
- **PostgreSQL Docs**: postgresql.org/docs
- **React Docs**: react.dev
- **Express Docs**: expressjs.com

---

## ✨ You're All Set!

Your Pocket Guard application is now live and accessible to users worldwide! 🌍

### What Happens Next?
1. Users can sign up and create accounts
2. Verify PAN and file income tax returns
3. Track EMIs and expenses
4. Get real-time tax calculations
5. File ITR-1 with government integration

### Growth Tips
- Share on social media
- Get user feedback
- Fix bugs quickly
- Add features based on user needs
- Monitor performance and costs
- Scale as you grow

---

**Congratulations on launching Pocket Guard! 🎉**

For issues or questions, refer to:
- DEPLOYMENT_GUIDE.md (comprehensive guide)
- Individual service documentation
- GitHub issues for bug reports

Happy launching! 🚀

---

**Next Step**: Go to your frontend URL and sign up!

https://pocket-guard-frontend.vercel.app
