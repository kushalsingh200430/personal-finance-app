import React, { useState } from 'react';
import * as panService from '../services/panService';

interface PANVerificationProps {
  onVerificationComplete?: (data: any) => void;
  onError?: (error: string) => void;
}

const PANVerification: React.FC<PANVerificationProps> = ({ onVerificationComplete, onError }) => {
  const [step, setStep] = useState<'input' | 'verification' | 'linkage' | 'confirmed'>('input');
  const [formData, setFormData] = useState({
    pan: '',
    name: '',
    dateOfBirth: '',
    fatherName: ''
  });
  const [aadhaarData, setAadhaarData] = useState({
    aadhaar: '',
    confirmAadhaar: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value.toUpperCase() });
    setError('');
  };

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAadhaarData({ ...aadhaarData, [name]: value });
    setError('');
  };

  const validatePANFormat = (pan: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const handleVerifyPAN = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!validatePANFormat(formData.pan)) {
        setError('Invalid PAN format. Expected: 10 characters (e.g., AAAPL5055K)');
        setLoading(false);
        return;
      }

      if (!formData.name) {
        setError('Name is required');
        setLoading(false);
        return;
      }

      const result = await panService.verifyPAN(formData);

      if (result.success) {
        setVerificationResult(result.data);
        setSuccess('PAN verified successfully!');
        setStep('linkage');
      } else {
        setError(result.error || 'PAN verification failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification error');
      onError?.(err.response?.data?.error || 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLinkage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (aadhaarData.aadhaar !== aadhaarData.confirmAadhaar) {
        setError('Aadhaar numbers do not match');
        setLoading(false);
        return;
      }

      if (!/^\d{12}$/.test(aadhaarData.aadhaar)) {
        setError('Invalid Aadhaar format. Must be 12 digits');
        setLoading(false);
        return;
      }

      const result = await panService.verifyPANAadhaarLinkage(formData.pan, aadhaarData.aadhaar);

      if (result.success) {
        if (result.linked) {
          setSuccess('PAN-Aadhaar linkage verified successfully!');
          setStep('confirmed');
          onVerificationComplete?.({
            pan: formData.pan,
            name: formData.name,
            aadhaar: aadhaarData.aadhaar,
            verificationData: verificationResult
          });
        } else {
          setError('PAN and Aadhaar are not linked. Please link them before proceeding.');
        }
      } else {
        setError(result.error || 'Linkage verification failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Linkage verification error');
      onError?.(err.response?.data?.error || 'Linkage verification error');
    } finally {
      setLoading(false);
    }
  };

  const resetVerification = () => {
    setStep('input');
    setFormData({ pan: '', name: '', dateOfBirth: '', fatherName: '' });
    setAadhaarData({ aadhaar: '', confirmAadhaar: '' });
    setError('');
    setSuccess('');
    setVerificationResult(null);
  };

  return (
    <div style={{ maxWidth: '500px', margin: '20px auto' }}>
      <h2>PAN Verification for Income Tax</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {step === 'input' && (
        <form onSubmit={handleVerifyPAN}>
          <div className="form-group">
            <label>PAN Number *</label>
            <input
              type="text"
              name="pan"
              value={formData.pan}
              onChange={handleInputChange}
              placeholder="e.g., AAAPL5055K"
              maxLength={10}
              required
              disabled={loading}
            />
            <small>Format: 5 letters, 4 digits, 1 letter</small>
          </div>

          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="As per PAN records"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Father's Name</label>
            <input
              type="text"
              name="fatherName"
              value={formData.fatherName}
              onChange={handleInputChange}
              placeholder="Optional"
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify PAN'}
          </button>
        </form>
      )}

      {step === 'linkage' && (
        <form onSubmit={handleVerifyLinkage}>
          <div style={{ padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '4px', marginBottom: '20px' }}>
            <p><strong>PAN Verified:</strong> {formData.pan}</p>
            <p><strong>Name:</strong> {formData.name}</p>
          </div>

          <h3>Step 2: Verify Aadhaar Linkage</h3>
          <p>Your PAN must be linked to your Aadhaar. Please provide your Aadhaar number.</p>

          <div className="form-group">
            <label>Aadhaar Number *</label>
            <input
              type="text"
              name="aadhaar"
              value={aadhaarData.aadhaar}
              onChange={handleAadhaarChange}
              placeholder="12-digit Aadhaar number"
              maxLength={12}
              pattern="[0-9]{12}"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Confirm Aadhaar Number *</label>
            <input
              type="text"
              name="confirmAadhaar"
              value={aadhaarData.confirmAadhaar}
              onChange={handleAadhaarChange}
              placeholder="Re-enter Aadhaar number"
              maxLength={12}
              pattern="[0-9]{12}"
              required
              disabled={loading}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={resetVerification} disabled={loading}>
              Back
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Linkage'}
            </button>
          </div>
        </form>
      )}

      {step === 'confirmed' && (
        <div style={{ padding: '20px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px' }}>
          <h3>✓ PAN Verification Complete</h3>
          <p>Your PAN has been successfully verified and linked to your Aadhaar.</p>
          <p>You can now proceed with income tax filing.</p>
          <button type="button" className="btn btn-primary" onClick={resetVerification}>
            Verify Another PAN
          </button>
        </div>
      )}
    </div>
  );
};

export default PANVerification;
