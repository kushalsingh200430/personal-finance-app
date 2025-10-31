import React, { useState } from 'react';
import PANVerification from '../components/PANVerification';
import PANDetails from '../components/PANDetails';

const ProfilePage: React.FC = () => {
  const [panVerified, setPanVerified] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePANVerified = () => {
    setPanVerified(true);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>Profile & PAN Management</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div>
          <h2>PAN Verification</h2>
          <PANVerification onVerificationComplete={handlePANVerified} />
        </div>
        <div>
          <h2>PAN Status</h2>
          <PANDetails refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
