-- Create Tax Data Table
CREATE TABLE IF NOT EXISTS tax_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fiscal_year VARCHAR(10) NOT NULL,
  gross_salary DECIMAL(12,2) DEFAULT 0,
  hra_received DECIMAL(10,2) DEFAULT 0,
  lta_transport_allowance DECIMAL(10,2) DEFAULT 0,
  deduction_80c DECIMAL(10,2) DEFAULT 0,
  deduction_80d DECIMAL(10,2) DEFAULT 0,
  deduction_80e DECIMAL(10,2) DEFAULT 0,
  home_loan_interest DECIMAL(10,2) DEFAULT 0,
  house_property_income DECIMAL(10,2) DEFAULT 0,
  other_income DECIMAL(10,2) DEFAULT 0,
  tds_deducted DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, fiscal_year)
);

CREATE INDEX idx_tax_data_user_id ON tax_data(user_id);
CREATE INDEX idx_tax_data_fiscal_year ON tax_data(fiscal_year);
