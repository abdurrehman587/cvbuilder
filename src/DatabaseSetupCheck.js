import React, { useState, useEffect } from 'react';
import { PaymentService } from './paymentService';

const DatabaseSetupCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isReady, setIsReady] = useState(null);
  const [error, setError] = useState(null);

  const checkDatabase = async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const ready = await PaymentService.checkDatabaseReady();
      setIsReady(ready);
      
      if (!ready) {
        setError('Database tables not found. Please run the SQL schema in Supabase.');
      }
    } catch (err) {
      setIsReady(false);
      setError(err.message);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  if (isChecking) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f0f9ff',
        border: '1px solid #0ea5e9',
        borderRadius: '8px',
        margin: '20px 0',
        textAlign: 'center'
      }}>
        🔍 Checking database setup...
      </div>
    );
  }

  if (isReady === null) {
    return null;
  }

  if (isReady) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #22c55e',
        borderRadius: '8px',
        margin: '20px 0',
        textAlign: 'center'
      }}>
        ✅ Database is ready! Payment system is working.
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#fef2f2',
      border: '1px solid #ef4444',
      borderRadius: '8px',
      margin: '20px 0'
    }}>
      <h3 style={{ color: '#dc2626', marginTop: 0 }}>⚠️ Database Setup Required</h3>
      
      {error && (
        <p style={{ color: '#dc2626', marginBottom: '15px' }}>
          <strong>Error:</strong> {error}
        </p>
      )}
      
      <p style={{ marginBottom: '15px' }}>
        The payment system requires database tables to be created in Supabase. Please follow these steps:
      </p>
      
      <ol style={{ marginBottom: '15px', paddingLeft: '20px' }}>
        <li>Go to your <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>Supabase Dashboard</a></li>
        <li>Select your CV Builder project</li>
        <li>Go to <strong>SQL Editor</strong></li>
        <li>Click <strong>New Query</strong></li>
        <li>Copy and paste the content from <code>database_setup.sql</code></li>
        <li>Click <strong>Run</strong> to execute the SQL</li>
        <li>Verify that <code>payments</code> and <code>cv_downloads</code> tables are created</li>
      </ol>
      
      <button
        onClick={checkDatabase}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        🔄 Check Again
      </button>
      
      <div style={{ marginTop: '15px', fontSize: '14px', color: '#6b7280' }}>
        <strong>Note:</strong> After setting up the database, refresh this page to verify the setup.
      </div>
    </div>
  );
};

export default DatabaseSetupCheck; 