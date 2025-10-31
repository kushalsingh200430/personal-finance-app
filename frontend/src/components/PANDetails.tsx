import React, { useState, useEffect } from 'react';
import * as panService from '../services/panService';

interface PANDetailsProps {
  refreshTrigger?: number;
}

const PANDetails: React.FC<PANDetailsProps> = ({ refreshTrigger = 0 }) => {
  const [panDetails, setPanDetails] = useState<any>(null);
  const [filingHistory, setFilingHistory] = useState<any[]>([]);
  const [verificationHistory, setVerificationHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'filing' | 'verification'>('details');

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [detailsRes, filingRes, verificationRes] = await Promise.all([
        panService.getPANDetails(),
        panService.getFilingHistory(),
        panService.getVerificationHistory()
      ]);

      if (detailsRes.success) {
        setPanDetails(detailsRes.pan_details);
      }
      if (filingRes.success) {
        setFilingHistory(filingRes.filings);
      }
      if (verificationRes.success) {
        setVerificationHistory(verificationRes.verifications);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading PAN details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!panDetails?.pan) {
    return (
      <div className="card">
        <p>No PAN details available. Please verify your PAN first.</p>
      </div>
    );
  }

  const getVerificationStatus = (status: string) => {
    const statusMap: Record<string, { color: string; icon: string }> = {
      verified: { color: '#28a745', icon: '✓' },
      pending: { color: '#ffc107', icon: '⏳' },
      failed: { color: '#dc3545', icon: '✗' },
      unverified: { color: '#6c757d', icon: '○' }
    };
    return statusMap[status] || statusMap.unverified;
  };

  const getFilingStatus = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      filed: { color: '#28a745', label: 'Filed' },
      pending: { color: '#ffc107', label: 'Pending' },
      rejected: { color: '#dc3545', label: 'Rejected' },
      processing: { color: '#17a2b8', label: 'Processing' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const verificationStatus = getVerificationStatus(panDetails.pan_verification_status);
  const verifiedDate = panDetails.pan_verified_at ? new Date(panDetails.pan_verified_at).toLocaleDateString('en-IN') : 'Not verified';

  return (
    <div className="card">
      <div style={{ marginBottom: '20px' }}>
        <h2>PAN & Income Tax Filing</h2>

        <div style={{
          padding: '15px',
          backgroundColor: '#f8f9fa',
          borderLeft: `4px solid ${verificationStatus.color}`,
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 5px 0' }}>{panDetails.pan}</h3>
              <p style={{ margin: '0', color: '#6c757d' }}>
                Status: <strong style={{ color: verificationStatus.color }}>
                  {verificationStatus.icon} {panDetails.pan_verification_status.toUpperCase()}
                </strong>
              </p>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#6c757d' }}>
                Last verified: {verifiedDate}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #dee2e6', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('details')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'details' ? 'bold' : 'normal',
            borderBottom: activeTab === 'details' ? '2px solid #007bff' : 'none',
            color: activeTab === 'details' ? '#007bff' : '#6c757d'
          }}
        >
          PAN Details
        </button>
        <button
          onClick={() => setActiveTab('filing')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'filing' ? 'bold' : 'normal',
            borderBottom: activeTab === 'filing' ? '2px solid #007bff' : 'none',
            color: activeTab === 'filing' ? '#007bff' : '#6c757d'
          }}
        >
          Filing History ({filingHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'verification' ? 'bold' : 'normal',
            borderBottom: activeTab === 'verification' ? '2px solid #007bff' : 'none',
            color: activeTab === 'verification' ? '#007bff' : '#6c757d'
          }}
        >
          Verification History ({verificationHistory.length})
        </button>
      </div>

      {/* PAN Details Tab */}
      {activeTab === 'details' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p style={{ color: '#6c757d', marginBottom: '5px' }}>PAN Number</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{panDetails.pan}</p>
            </div>
            <div>
              <p style={{ color: '#6c757d', marginBottom: '5px' }}>Verification Status</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: verificationStatus.color }}>
                {panDetails.pan_verification_status.toUpperCase()}
              </p>
            </div>
          </div>
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
            <p><strong>Note:</strong> Your PAN has been verified and linked to your Aadhaar for ITR filing purposes.</p>
          </div>
        </div>
      )}

      {/* Filing History Tab */}
      {activeTab === 'filing' && (
        <div>
          {filingHistory.length === 0 ? (
            <p style={{ color: '#6c757d' }}>No filing records found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Fiscal Year</th>
                  <th>Form</th>
                  <th>Status</th>
                  <th>Reference #</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filingHistory.map((filing: any) => {
                  const status = getFilingStatus(filing.filing_status);
                  return (
                    <tr key={filing.id}>
                      <td>{filing.fiscal_year}</td>
                      <td>{filing.itr_form}</td>
                      <td><span style={{ color: status.color, fontWeight: 'bold' }}>{status.label}</span></td>
                      <td>{filing.reference_number}</td>
                      <td>{new Date(filing.submission_timestamp).toLocaleDateString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Verification History Tab */}
      {activeTab === 'verification' && (
        <div>
          {verificationHistory.length === 0 ? (
            <p style={{ color: '#6c757d' }}>No verification records found.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>PAN</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {verificationHistory.map((verification: any) => {
                  const status = getVerificationStatus(verification.verification_status);
                  return (
                    <tr key={verification.id}>
                      <td>{verification.pan}</td>
                      <td><span style={{ color: status.color, fontWeight: 'bold' }}>
                        {status.icon} {verification.verification_status.toUpperCase()}
                      </span></td>
                      <td>{verification.verification_source || 'Government API'}</td>
                      <td>{new Date(verification.verified_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default PANDetails;
