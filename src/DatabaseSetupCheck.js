import React, { useState, useEffect } from 'react';
import supabase from './supabase';

const DatabaseSetupCheck = () => {
  const [isSetup, setIsSetup] = useState(false);
  const [error, setError] = useState(null);
  const [cvTablesStatus, setCvTablesStatus] = useState(null);

  const checkDatabase = async () => {
    try {
      setError(null);
      
      // Check if payments table exists
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('count')
        .limit(1);

      if (paymentsError) {
        setError(`Payments table error: ${paymentsError.message}`);
        setIsSetup(false);
        return;
      }

      // Check if user_cvs table exists
      const { data: userCvsData, error: userCvsError } = await supabase
        .from('user_cvs')
        .select('count')
        .limit(1);

      if (userCvsError) {
        setCvTablesStatus(`User CVs table error: ${userCvsError.message}`);
      } else {
        setCvTablesStatus('User CVs table exists and is accessible');
      }

      // Check if admin_cvs table exists
      const { data: adminCvsData, error: adminCvsError } = await supabase
        .from('admin_cvs')
        .select('count')
        .limit(1);

      if (adminCvsError) {
        setCvTablesStatus(prev => prev ? `${prev}. Admin CVs table error: ${adminCvsError.message}` : `Admin CVs table error: ${adminCvsError.message}`);
      } else {
        setCvTablesStatus(prev => prev ? `${prev}. Admin CVs table exists and is accessible` : 'Admin CVs table exists and is accessible');
      }

      setIsSetup(true);
    } catch (err) {
      setError(`Database check failed: ${err.message}`);
      setIsSetup(false);
    }
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  if (isSetup && !cvTablesStatus?.includes('error')) {
    return null; // Don't show anything if everything is set up correctly
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

      {cvTablesStatus && (
        <p style={{ color: '#dc2626', marginBottom: '15px' }}>
          <strong>CV Tables Status:</strong> {cvTablesStatus}
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
        <li>Copy and paste the content from <code>create_simple_cv_tables.sql</code></li>
        <li>Click <strong>Run</strong> to execute the SQL</li>
        <li>Verify that <code>user_cvs</code> and <code>admin_cvs</code> tables are created</li>
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