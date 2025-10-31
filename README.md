# Pocket Guard - Personal Finance Management Platform

Pocket Guard is a comprehensive personal finance management platform designed for Indian users. It helps you manage EMIs, track expenses, calculate taxes, and file income tax returns (ITR-1) all in one place.

## 🚀 Quick Start

### With Docker (Recommended)
```bash
docker-compose up -d
```
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database: localhost:5432

### Manual Setup

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

## 📋 Features

- ✅ EMI Calculator with amortization schedules
- ✅ Expense tracking with categorization
- ✅ Income tax filing (ITR-1) integration
- ✅ Two-factor authentication (2FA)
- ✅ India-centric design (INR, Indian tax rules)
- ✅ PDF/CSV export for reports
- ✅ Secure JWT-based authentication

## 🏗️ Architecture

- **Backend**: Node.js + Express.js + TypeScript + PostgreSQL
- **Frontend**: React 18 + TypeScript
- **Auth**: JWT + SMS OTP (Twilio)
- **Database**: PostgreSQL with migrations

## 📁 Project Structure

```
personal-finance-app/
├── backend/          # Express API
├── frontend/         # React UI
├── database/         # SQL migrations
└── docker-compose.yml
```

## 🔧 Environment Variables

See `.env.example` files in backend/ and frontend/ directories.

## 📚 Documentation

- **API Docs**: Check backend routes in src/routes/
- **Database Schema**: See database/migrations/
- **Utilities**: EMI and tax calculations in backend/src/utils/

## 🔐 Security

- Password hashing (bcrypt)
- JWT authentication
- 2FA with SMS OTP
- CORS + Helmet.js
- Input validation
- CSRF protection

## 📊 Tax Calculations

Implements Indian tax rules (FY 2024-25):
- Tax slabs: 0%, 5%, 10%, 15%, 20%, 30%
- Standard deduction: 50% of salary (max ₹50,000)
- 80C limit: ₹1,50,000
- ITR-1 for income < ₹50 lakhs

## 📱 Supported Features

- EMI calculation formula: EMI = (P × R × (1 + R)^T) / ((1 + R)^T - 1)
- Expense categories: Food, Transport, Utilities, etc.
- Loan types: Home, Auto, Personal, Education
- Payment methods: Cash, Card, Bank Transfer, UPI

## 🚧 Development

```bash
# Backend development
cd backend && npm run dev

# Frontend development
cd frontend && npm start

# Build backend
cd backend && npm run build

# Build frontend
cd frontend && npm run build
```

## 📝 License

ISC License

---

**Pocket Guard** - Personal Finance Made Simple 💰