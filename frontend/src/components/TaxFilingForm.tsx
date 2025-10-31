import React, { useState, useEffect } from 'react';
import * as taxService from '../services/taxService';
import * as panService from '../services/panService';
import { formatINR, getFinancialYear } from '../utils/formatters';

interface TaxFilingFormProps {
  fiscalYear?: string;
  onSubmissionComplete?: (data: any) => void;
  onError?: (error: string) => void;
}

const TaxFilingForm: React.FC<TaxFilingFormProps> = ({
  fiscalYear = getFinancialYear(),
  onSubmissionComplete,
  onError
}) => {
  const [step, setStep] = useState<'verification' | 'data' | 'review' | 'submitted'>('verification');
  const [panVerified, setPanVerified] = useState(false);
  const [panDetails, setPanDetails] = useState<any>(null);
  const [formData, setFormData] = useState({
    gross_salary: '',
    hra_received: '',
    lta_transport_allowance: '',
    deduction_80c: '',
    deduction_80d: '',
    deduction_80e: '',
    home_loan_interest: '',
    house_property_income: '',
    other_income: '',
    tds_deducted: ''
  });
  const [calculation, setCalculation] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  useEffect(() => {
    checkPANVerification();
  }, []);

  const checkPANVerification = async () => {
    try {
      const result = await panService.getPANDetails();
      if (result.success && result.pan_details?.pan_verification_status === 'verified') {
        setPanVerified(true);
        setPanDetails(result.pan_details);
        setStep('data');
      }
    } catch (err: any) {
      console.error('Error checking PAN:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
  };

  const validateInputs = (): boolean => {
    if (!formData.gross_salary) {
      setError('Gross salary is required');
      return false;
    }
    if (parseFloat(formData.gross_salary) >= 5000000) {
      setError('Income exceeds ₹50 lakhs. Use ITR-2 or higher forms.');
      return false;
    }
    return true;
  };

  const handleCalculateTax = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError('');

    try {
      // Save tax data
      const saveResult = await taxService.saveTaxData(fiscalYear, formData);

      if (saveResult.success) {
        setCalculation(saveResult.calculation);
        setSuccess('Tax data saved and calculated successfully');
        setStep('review');
      } else {
        setError(saveResult.error || 'Failed to save tax data');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Tax calculation failed';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitITR = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await taxService.submitITR(fiscalYear, true);

      if (result.success) {
        setSubmissionResult(result);
        setSuccess('ITR-1 filed successfully!');

        // Store filing record
        await panService.storeFilingRecord({
          fiscalYear,
          itrForm: 'ITR-1',
          referenceNumber: result.itr_reference_number,
          submissionTimestamp: result.submission_timestamp,
          ackNumber: result.ack_number
        });

        setStep('submitted');
        onSubmissionComplete?.(result);
      } else {
        setError(result.error || 'ITR submission failed');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'ITR filing failed';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: PAN Verification
  if (step === 'verification') {
    return (
      <div className="card">
        <h2>Income Tax Return Filing (ITR-1)</h2>
        {panVerified ? (
          <div style={{ padding: '20px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
            <h3>✓ PAN Verified</h3>
            <p>PAN: <strong>{panDetails.pan}</strong></p>
            <p>Status: <strong>Verified</strong></p>
            <button
              className="btn btn-primary"
              onClick={() => setStep('data')}
              style={{ marginTop: '15px' }}
            >
              Proceed to Filing
            </button>
          </div>
        ) : (
          <div style={{ padding: '20px', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
            <h3>PAN Verification Required</h3>
            <p>Your PAN has not been verified yet. Please verify your PAN before filing ITR.</p>
            <p>
              <a href="/profile" style={{ color: '#007bff', textDecoration: 'none' }}>
                Go to Profile → Verify PAN
              </a>
            </p>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Tax Data Collection
  if (step === 'data') {
    return (
      <div className="card">
        <h2>ITR-1 Filing for FY {fiscalYear}</h2>
        <h3>Financial Data Entry</h3>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <form>
          <h4>Income Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>Gross Salary (₹) *</label>
              <input
                type="number"
                name="gross_salary"
                value={formData.gross_salary}
                onChange={handleInputChange}
                placeholder="0"
                disabled={loading}
              />
              <small>Your salary income for the financial year</small>
            </div>

            <div className="form-group">
              <label>HRA Received (₹)</label>
              <input
                type="number"
                name="hra_received"
                value={formData.hra_received}
                onChange={handleInputChange}
                placeholder="0"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>LTA / Transport Allowance (₹)</label>
              <input
                type="number"
                name="lta_transport_allowance"
                value={formData.lta_transport_allowance}
                onChange={handleInputChange}
                placeholder="0"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>House Property Income (₹)</label>
              <input
                type="number"
                name="house_property_income"
                value={formData.house_property_income}
                onChange={handleInputChange}
                placeholder="0"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Other Income (₹)</label>
              <input
                type="number"
                name="other_income"
                value={formData.other_income}
                onChange={handleInputChange}
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>

          <h4 style={{ marginTop: '30px' }}>Deductions</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label>80C Deduction (₹) (max ₹1,50,000)</label>
              <input
                type="number"
                name="deduction_80c"
                value={formData.deduction_80c}
                onChange={handleInputChange}
                placeholder="0"
                max="150000"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>80D Deduction (₹) (Health Insurance)</label>
              <input
                type="number"
                name="deduction_80d"
                value={formData.deduction_80d}
                onChange={handleInputChange}
                placeholder="0"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>80E Deduction (₹) (Education Loan Interest)</label>
              <input
                type="number"
                name="deduction_80e"
                value={formData.deduction_80e}
                onChange={handleInputChange}
                placeholder="0"
                max="100000"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Home Loan Interest (₹) (max ₹2,00,000)</label>
              <input
                type="number"
                name="home_loan_interest"
                value={formData.home_loan_interest}
                onChange={handleInputChange}
                placeholder="0"
                max="200000"
                disabled={loading}
              />
            </div>
          </div>

          <h4 style={{ marginTop: '30px' }}>Tax Deducted</h4>
          <div className="form-group">
            <label>TDS/Tax Deducted at Source (₹)</label>
            <input
              type="number"
              name="tds_deducted"
              value={formData.tds_deducted}
              onChange={handleInputChange}
              placeholder="0"
              disabled={loading}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCalculateTax}
            disabled={loading}
            style={{ marginTop: '20px' }}
          >
            {loading ? 'Calculating...' : 'Calculate & Review'}
          </button>
        </form>
      </div>
    );
  }

  // Step 3: Review & Submit
  if (step === 'review' && calculation) {
    return (
      <div className="card">
        <h2>ITR-1 Review & Submission</h2>

        {error && <div className="error">{error}</div>}

        <h3>Tax Calculation Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <p style={{ color: '#6c757d', marginBottom: '5px' }}>Gross Income</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatINR(calculation.grossIncome)}</p>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <p style={{ color: '#6c757d', marginBottom: '5px' }}>Total Deductions</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>({formatINR(calculation.totalDeductions)})</p>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <p style={{ color: '#6c757d', marginBottom: '5px' }}>Taxable Income</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatINR(calculation.taxableIncome)}</p>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
            <p style={{ color: '#6c757d', marginBottom: '5px' }}>Tax Liability</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#856404' }}>{formatINR(calculation.taxLiability)}</p>
          </div>
          <div style={{ padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '4px' }}>
            <p style={{ color: '#0c5460', marginBottom: '5px' }}>TDS Deducted</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatINR(parseFloat(formData.tds_deducted) || 0)}</p>
          </div>
          <div style={{
            padding: '15px',
            backgroundColor: calculation.refundOrBalance >= 0 ? '#d4edda' : '#f8d7da',
            borderRadius: '4px'
          }}>
            <p style={{ color: '#6c757d', marginBottom: '5px' }}>
              {calculation.refundOrBalance >= 0 ? 'Refund Due' : 'Tax to Pay'}
            </p>
            <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {formatINR(Math.abs(calculation.refundOrBalance))}
            </p>
          </div>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '4px', marginBottom: '20px' }}>
          <p><strong>Effective Tax Rate:</strong> {calculation.effectiveTaxRate}%</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setStep('data')}
            disabled={loading}
          >
            Back
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmitITR}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit ITR-1'}
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Submitted
  if (step === 'submitted' && submissionResult) {
    return (
      <div className="card">
        <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#d4edda', borderRadius: '4px' }}>
          <h2>✓ ITR-1 Filed Successfully</h2>
          <p style={{ fontSize: '18px', marginBottom: '20px' }}>Your income tax return has been submitted to the government portal.</p>

          <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '4px', marginBottom: '20px' }}>
            <p><strong>Reference Number:</strong></p>
            <p style={{ fontSize: '16px', color: '#007bff' }}>{submissionResult.itr_reference_number}</p>
            <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '10px' }}>Save this number for your records</p>
          </div>

          <p><strong>Fiscal Year:</strong> {fiscalYear}</p>
          <p><strong>Submission Time:</strong> {new Date(submissionResult.submission_timestamp).toLocaleString('en-IN')}</p>

          <button
            className="btn btn-primary"
            onClick={() => window.location.href = '/'}
            style={{ marginTop: '20px' }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default TaxFilingForm;
