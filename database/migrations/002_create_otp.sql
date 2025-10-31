-- Create OTP Table
CREATE TABLE IF NOT EXISTS otp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_code VARCHAR(6) NOT NULL,
  purpose VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT false
);

CREATE INDEX idx_otp_user_id ON otp(user_id);
CREATE INDEX idx_otp_expires_at ON otp(expires_at);
