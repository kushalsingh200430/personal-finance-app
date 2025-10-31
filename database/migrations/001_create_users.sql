-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  phone_number VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  pan VARCHAR(10) UNIQUE NOT NULL,
  aadhaar VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  two_fa_enabled BOOLEAN DEFAULT true,
  two_fa_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_email_or_phone CHECK (email IS NOT NULL OR phone_number IS NOT NULL)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_pan ON users(pan);
