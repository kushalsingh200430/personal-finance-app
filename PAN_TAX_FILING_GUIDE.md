# PAN Verification & Income Tax Filing (ITR-1) Guide

## Overview

Pocket Guard now includes comprehensive PAN (Permanent Account Number) verification and income tax filing (ITR-1) capabilities. Users can verify their PAN, manage tax data throughout the financial year, and file their income tax returns directly through the platform.

## Features

### 1. PAN Verification
- **Multi-step verification process**: User inputs PAN, name, date of birth
- **Government API integration**: Connects to government records for validation
- **Aadhaar linkage verification**: Ensures PAN-Aadhaar linkage as required by tax authorities
- **Verification history tracking**: Maintains records of all PAN verifications
- **Secure storage**: PAN data encrypted in database

### 2. Tax Data Collection
- **Year-round data entry**: Collect tax data throughout the financial year
- **Multiple income sources**: Salary, HRA, LTA, rental income, other income
- **Deduction tracking**: Sections 80C, 80D, 80E, home loan interest
- **TDS tracking**: Track tax deducted by employer
- **Auto-calculation**: System auto-calculates tax liability based on data

### 3. ITR-1 Filing
- **Pre-filled forms**: Auto-populate with collected data
- **Tax calculation**: Real-time tax liability calculation
- **Eligibility verification**: Ensures income is within ITR-1 limits (<₹50 lakhs)
- **Government submission**: Direct submission to Income Tax e-filing portal
- **Filing tracking**: Store and track all ITR filings with reference numbers

### 4. Filing History
- **View all filings**: Track all ITR submissions for multiple years
- **Filing status**: Check current status of each filing
- **Download records**: Access filed ITR copies and acknowledgments

## Architecture

### Backend Components

#### Database Schema

**PAN Verifications Table** (`pan_verifications`)
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key)
- pan: VARCHAR(10)
- verification_status: VARCHAR(20) ('verified', 'pending', 'failed', 'unverified')
- name_verified: VARCHAR(255)
- date_of_birth_verified: DATE
- father_name_verified: VARCHAR(255)
- verified_at: TIMESTAMP
- verification_source: VARCHAR(50) ('government_api', 'manual', etc.)
- api_response: JSONB (stores full API response)
- created_at, updated_at: TIMESTAMP
```

**ITR Filings Table** (`itr_filings`)
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key)
- fiscal_year: VARCHAR(10) (e.g., '2024-25')
- itr_form: VARCHAR(10) ('ITR-1', 'ITR-2', etc.)
- reference_number: VARCHAR(50) UNIQUE
- filing_status: VARCHAR(20) ('filed', 'pending', 'rejected', 'processing')
- submission_timestamp: TIMESTAMP
- confirmation_number: VARCHAR(50)
- ack_number: VARCHAR(50)
- filing_xml: JSONB
- government_response: JSONB
- created_at, updated_at: TIMESTAMP
```

#### Services

**panService.ts**
```typescript
- validatePANFormat(pan: string): boolean
- verifyPAN(panData: PANData): Promise<PANVerificationResult>
- verifyPANAadhaarLinkage(pan: string, aadhaar: string): Promise<LinkageResult>
- updatePANVerificationStatus(userId: string, panData: PANData, status: string): Promise<boolean>
- getPANVerificationHistory(userId: string): Promise<any[]>
- getPANFilingHistory(pan: string): Promise<any[]>
- validatePANForITRFiling(pan: string, income: number): Promise<EligibilityResult>
```

#### Controllers

**panController.ts**
- POST `/api/pan/verify` - Verify PAN
- POST `/api/pan/verify-linkage` - Verify PAN-Aadhaar linkage
- GET `/api/pan/details` - Get current PAN details
- GET `/api/pan/verification-history` - Get verification history
- GET `/api/pan/filing-history` - Get ITR filing history
- GET `/api/pan/filing/:fiscal_year` - Get specific filing status
- POST `/api/pan/validate-for-itr` - Check ITR eligibility
- POST `/api/pan/store-filing` - Store ITR filing record

**taxController.ts** (Enhanced)
- Now includes PAN verification requirement before ITR filing
- Validates PAN is verified before submission

### Frontend Components

#### PANVerification Component
```typescript
Props:
- onVerificationComplete?: (data: any) => void
- onError?: (error: string) => void

Features:
- Step 1: PAN input form (PAN, name, DOB, father's name)
- Step 2: Aadhaar linkage verification
- Step 3: Confirmation page
- Error handling and validation
```

#### PANDetails Component
```typescript
Props:
- refreshTrigger?: number

Displays:
- Current PAN and verification status
- Verification history table
- ITR filing history table
- Filing status with icons
```

#### TaxFilingForm Component
```typescript
Props:
- fiscalYear?: string
- onSubmissionComplete?: (data: any) => void
- onError?: (error: string) => void

Steps:
1. PAN verification check
2. Tax data collection (income, deductions, TDS)
3. Tax calculation review
4. ITR-1 submission
5. Filing confirmation
```

#### Updated Pages
- **ProfilePage**: Now includes PANVerification and PANDetails components
- **TaxPage**: Enhanced with TaxFilingForm and PANDetails side-by-side

## User Workflow

### Initial Setup (First Time)

1. **User navigates to Profile**
   - Sees "PAN Verification" section
   - Enters PAN, full name, date of birth (optional)
   - Clicks "Verify PAN"

2. **PAN Verification**
   - System validates PAN format
   - Calls government verification service
   - If verification fails, shows error with guidance

3. **Aadhaar Linkage Verification**
   - User enters Aadhaar number
   - System verifies PAN-Aadhaar linkage
   - Shows confirmation upon success

4. **Verification Complete**
   - PAN marked as verified in database
   - User can now proceed with tax filing

### Tax Filing Workflow

1. **Navigate to Tax Filing Page**
   - System checks if PAN is verified
   - If not verified, shows link to Profile

2. **Enter Tax Data**
   - User enters income details throughout the year
   - Fills in deductions, TDS information
   - Clicks "Calculate & Review"

3. **Review & Submit**
   - System displays tax calculation
   - Shows gross income, deductions, taxable income, tax liability
   - Displays refund or balance due
   - User confirms and submits ITR-1

4. **Filing Confirmation**
   - System submits to government portal
   - Receives reference number
   - Stores filing record in database
   - Shows confirmation with reference number

5. **View History**
   - User can view all ITR filings on PAN Details page
   - Access previous year filings
   - Track filing status

## API Integration

### Government API Endpoints

**PAN Verification API** (Mock in development)
```
Endpoint: /api.nsdl.co.in/v1/pan/verify
Method: POST
Headers:
  - Authorization: Bearer {GOVERNMENT_API_KEY}
  - Content-Type: application/json

Request Body:
{
  "pan": "AAAPL5055K",
  "name": "John Doe",
  "date_of_birth": "1990-01-15"
}

Response:
{
  "success": true,
  "verified": true,
  "data": {
    "pan": "AAAPL5055K",
    "name": "John Doe",
    "entity_type": "Individual",
    "date_of_birth": "1990-01-15",
    "status": "Active"
  }
}
```

**PAN-Aadhaar Linkage API** (Mock in development)
```
Endpoint: /api.incometax.gov.in/v1/pan-aadhaar/verify
Method: POST
Headers:
  - Authorization: Bearer {GOVERNMENT_API_KEY}

Request Body:
{
  "pan": "AAAPL5055K",
  "aadhaar": "123456789012"
}

Response:
{
  "linked": true,
  "message": "PAN-Aadhaar linkage verified"
}
```

**ITR-1 Submission API** (Mock in development)
```
Endpoint: /incometax.gov.in/api/itr/submit
Method: POST
Headers:
  - Authorization: Bearer {GOVERNMENT_API_KEY}

Request Body:
{
  "xml": "<ITR1>...</ITR1>",
  "pan": "AAAPL5055K",
  "aadhaar": "123456789012"
}

Response:
{
  "success": true,
  "refNumber": "ITR-2024-1234567",
  "message": "ITR submitted successfully"
}
```

## Environment Variables

### Backend (.env)

```bash
# PAN Verification API
GOVERNMENT_PAN_VERIFICATION_URL=https://api.nsdl.co.in/v1/pan/verify
GOVERNMENT_LINKAGE_CHECK_URL=https://api.incometax.gov.in/v1/pan-aadhaar/verify
GOVERNMENT_API_KEY=your_api_key_here

# Enable real API calls in production
NODE_ENV=production
```

### Frontend (.env)

No additional environment variables needed. API communication handled through main API client.

## Tax Calculation Logic

### Income Components
- Gross Salary (from employment)
- HRA (House Rent Allowance) - deductible
- LTA/Transport Allowance - deductible
- House Property Income (if applicable)
- Other Income (interest, dividends, etc.)

### Deductions
- **Section 80C**: Up to ₹1,50,000 (ELSS, PPF, Insurance, etc.)
- **Section 80D**: Health insurance premiums (₹25,000-₹1,00,000 based on age)
- **Section 80E**: Education loan interest (up to ₹1,00,000)
- **Home Loan Interest**: Up to ₹2,00,000
- **Standard Deduction**: 50% of salary (max ₹50,000)

### Tax Slabs (FY 2024-25)
- ₹0 - ₹3,00,000: 0%
- ₹3,00,001 - ₹6,00,000: 5%
- ₹6,00,001 - ₹9,00,000: 10%
- ₹9,00,001 - ₹12,00,000: 15%
- ₹12,00,001 - ₹15,00,000: 20%
- ₹15,00,001+: 30%

### Health & Education Cess
- 4% on calculated tax

### ITR-1 Eligibility
- Gross income < ₹50 lakhs
- Salaried individuals or self-employed with no business income
- No capital gains in the year

## Validation Rules

### PAN Format Validation
```
Format: 5 letters + 4 digits + 1 letter
Example: AAAPL5055K
Regex: ^[A-Z]{5}[0-9]{4}[A-Z]{1}$
```

### Aadhaar Format Validation
```
Format: 12 digits
Regex: ^[0-9]{12}$
```

### Income Validation
```
- Maximum income for ITR-1: ₹50,00,000
- All amounts must be non-negative
- Deductions cannot exceed limits
```

### Deduction Limits
```
80C: ₹1,50,000 max
80D: ₹25,000 (individual), ₹50,000 (senior citizen), ₹1,00,000 (very senior citizen)
80E: ₹1,00,000 max
Home Loan Interest: ₹2,00,000 max
```

## Error Handling

### Common Errors & Solutions

**"Invalid PAN format"**
- Cause: PAN doesn't match required format
- Solution: Verify PAN is 10 characters (5 letters, 4 digits, 1 letter)

**"PAN verification failed"**
- Cause: PAN not found in government records
- Solution: Verify PAN details with your tax record or income tax department

**"PAN-Aadhaar linkage failed"**
- Cause: PAN and Aadhaar not linked in government system
- Solution: Link PAN with Aadhaar on income tax website (pan.utisl.com)

**"Income exceeds ₹50 lakhs"**
- Cause: Gross income entered exceeds ITR-1 limit
- Solution: Use ITR-2 or higher forms for income above ₹50 lakhs

**"Deduction exceeds limit"**
- Cause: Deduction value exceeds prescribed limit
- Solution: Check individual deduction limits for each section

**"Deduction limit exceeded for section 80D based on age"**
- Cause: Health insurance deduction exceeds age-based limit
- Solution: Verify user age and apply correct limit

## Testing

### Manual Testing Checklist

**PAN Verification Flow**
- [ ] Enter valid PAN and verify successfully
- [ ] Try invalid PAN format and see error
- [ ] Verify PAN-Aadhaar linkage
- [ ] View verification history

**Tax Filing Flow**
- [ ] Verify PAN before accessing tax filing
- [ ] Enter income and deduction data
- [ ] Calculate tax and review
- [ ] Submit ITR-1 and receive reference number
- [ ] View filing in history

**Edge Cases**
- [ ] Income at ₹50,00,000 boundary
- [ ] Zero deductions
- [ ] Negative refund (tax to pay)
- [ ] Large deduction values

### Sample Test Data

**PAN**: AAAPL5055K
**Name**: John Doe
**Aadhaar**: 123456789012
**Gross Salary**: ₹10,00,000
**HRA**: ₹2,00,000
**Deduction 80C**: ₹1,50,000
**TDS**: ₹1,50,000

Expected Tax Liability: Approximately ₹1,10,000

## Migration & Deployment

### Database Migrations Required

1. `006_add_pan_verification.sql`
   - Creates pan_verifications table
   - Creates itr_filings table
   - Adds columns to users table

### Steps to Deploy

```bash
# 1. Backend: Install dependencies
cd backend
npm install

# 2. Database: Run migrations
psql pocket_guard_db < database/migrations/006_add_pan_verification.sql

# 3. Environment: Update .env with government API keys
GOVERNMENT_API_KEY=your_key_here

# 4. Frontend: No additional dependencies needed

# 5. Test PAN verification and tax filing workflows
```

## Future Enhancements

1. **Multi-form Support**: ITR-2, ITR-3, ITR-4 for different income sources
2. **Document Upload**: Upload income certificates, deduction proofs
3. **Tax Planning**: Suggestions for tax optimization
4. **Bulk Filing**: File for multiple family members
5. **Payment Integration**: Online tax payment
6. **Real Government API**: Full integration with official government APIs
7. **Mobile App**: Native iOS/Android apps
8. **Audit Trail**: Complete audit trail of all changes

## Support & Troubleshooting

### Common Issues

**Q: Why does PAN verification fail even though my PAN is correct?**
A: The government API might be temporarily unavailable. In development mode, verification should succeed. In production, ensure your government API key is valid.

**Q: Can I file ITR if my PAN is not verified?**
A: No. PAN verification is mandatory before filing ITR-1 for security and compliance reasons.

**Q: What happens if I submit ITR and then find an error?**
A: ITR-1 can be revised/amended by filing a revised return. Contact your tax advisor for assistance.

**Q: How long does it take for government to process my ITR?**
A: Typically 24-48 hours. Check status on the income tax e-filing portal using your reference number.

### Getting Help

- Contact support: support@pocketguard.com
- FAQ: www.pocketguard.com/help/itr-filing
- Documentation: See this file and inline code comments

---

**Version**: 1.0
**Last Updated**: October 2024
**Maintained By**: Pocket Guard Team
