import React, { useState, useEffect } from 'react';
import { migratePaymentStatuses, checkMigrationStatus } from './migratePaymentStatus';
import { debugPaymentStatus } from './debugPaymentStatus';

const PaymentMigrationAdmin = () => {
  const [migrationStatus, setMigrationStatus] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [debugResult, setDebugResult] = useState(null);
  const [templateId, setTemplateId] = useState('template1');

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const status = await checkMigrationStatus();
      setMigrationStatus(status);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const runMigration = async () => {
    setIsMigrating(true);
    try {
      const result = await migratePaymentStatuses();
      console.log('Migration result:', result);
      await checkStatus(); // Refresh status after migration
    } catch (error) {
      console.error('Migration error:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const runDebug = async () => {
    try {
      const result = await debugPaymentStatus(templateId);
      setDebugResult(result);
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Payment System Migration Admin</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Migration Status</h2>
        {migrationStatus ? (
          <div>
            <p><strong>Payment Status Counts:</strong></p>
            <ul>
              {Object.entries(migrationStatus.paymentCounts || {}).map(([status, count]) => (
                <li key={status}>{status}: {count}</li>
              ))}
            </ul>
            <p><strong>Download Records:</strong> {migrationStatus.downloadCount}</p>
            <p><strong>Needs Migration:</strong> {migrationStatus.needsMigration ? 'Yes' : 'No'}</p>
          </div>
        ) : (
          <p>Loading status...</p>
        )}
        
        <button 
          onClick={runMigration} 
          disabled={isMigrating}
          style={{
            padding: '10px 20px',
            backgroundColor: isMigrating ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isMigrating ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isMigrating ? 'Migrating...' : 'Run Migration'}
        </button>
        
        <button 
          onClick={checkStatus}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh Status
        </button>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Debug Payment Status</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Template ID: 
            <input
              type="text"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
        </div>
        
        <button 
          onClick={runDebug}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Debug Payment Status
        </button>
        
        {debugResult && (
          <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <h3>Debug Result for Template: {templateId}</h3>
            <p><strong>User:</strong> {debugResult.user}</p>
            <p><strong>Approved Payments:</strong> {debugResult.approvedCount}</p>
            <p><strong>Pending Payments:</strong> {debugResult.pendingCount}</p>
            <p><strong>Legacy Downloaded Payments:</strong> {debugResult.downloadedCount}</p>
            <p><strong>Download Records:</strong> {debugResult.downloadCount}</p>
            <p><strong>Expected Button Text:</strong> {debugResult.expectedButtonText}</p>
            {debugResult.hasLegacyDownloads && (
              <p style={{ color: '#dc3545', fontWeight: 'bold' }}>
                ⚠️ This user has legacy downloaded payments that need migration!
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <h2>Instructions</h2>
        <ol>
          <li>Check the migration status to see if any payments need to be migrated</li>
          <li>If there are payments with 'downloaded' status, run the migration</li>
          <li>Use the debug tool to check specific user payment status</li>
          <li>After migration, users should be able to download multiple times with approved payments</li>
        </ol>
        
        <h3>What the migration does:</h3>
        <ul>
          <li>Changes all payments with 'downloaded' status to 'approved' status</li>
          <li>Creates download records in the cv_downloads table</li>
          <li>Allows users to download multiple times with approved payments</li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentMigrationAdmin; 