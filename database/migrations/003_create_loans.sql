-- Create Loans Table
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loan_name VARCHAR(255) NOT NULL,
  loan_type VARCHAR(50) NOT NULL,
  principal_amount DECIMAL(15,2) NOT NULL,
  annual_interest_rate DECIMAL(5,2) NOT NULL,
  loan_tenure_months INTEGER NOT NULL,
  start_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_status ON loans(status);
