import React, { useState } from 'react';
import TaxFilingForm from '../components/TaxFilingForm';
import PANDetails from '../components/PANDetails';

const TaxPage: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFilingComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <TaxFilingForm onSubmissionComplete={handleFilingComplete} />
        </div>
        <div>
          <PANDetails refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
};

export default TaxPage;
