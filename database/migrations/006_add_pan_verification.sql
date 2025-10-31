-- Add PAN verification columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_verified_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pan_verification_status VARCHAR(20) DEFAULT 'unverified';

-- Create PAN verification history table
CREATE TABLE IF NOT EXISTS pan_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pan VARCHAR(10) NOT NULL,
  verification_status VARCHAR(20) NOT NULL,
  name_verified VARCHAR(255),
  date_of_birth_verified DATE,
  father_name_verified VARCHAR(255),
  verified_at TIMESTAMP,
  verification_source VARCHAR(50),
  api_response JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pan_verifications_user_id ON pan_verifications(user_id);
CREATE INDEX idx_pan_verifications_status ON pan_verifications(verification_status);

-- Create ITR filing records table
CREATE TABLE IF NOT EXISTS itr_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fiscal_year VARCHAR(10) NOT NULL,
  itr_form VARCHAR(10) NOT NULL,
  reference_number VARCHAR(50) UNIQUE,
  filing_status VARCHAR(20) NOT NULL,
  submission_timestamp TIMESTAMP,
  confirmation_number VARCHAR(50),
  ack_number VARCHAR(50),
  filing_xml JSONB,
  government_response JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, fiscal_year)
);

CREATE INDEX idx_itr_filings_user_id ON itr_filings(user_id);
CREATE INDEX idx_itr_filings_fiscal_year ON itr_filings(fiscal_year);
CREATE INDEX idx_itr_filings_status ON itr_filings(filing_status);
