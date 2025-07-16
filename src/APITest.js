import React, { useState } from 'react';
import supabase from './supabase';

const APITest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const testHealthCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setTestResults(prev => ({ ...prev, health: { success: true, data } }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, health: { success: false, error: error.message } }));
    }
    setLoading(false);
  };

  const testSupabaseConnection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('id')
        .limit(1);
      
      if (error) {
        setTestResults(prev => ({ ...prev, supabase: { success: false, error: error.message } }));
      } else {
        setTestResults(prev => ({ ...prev, supabase: { success: true, data } }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, supabase: { success: false, error: error.message } }));
    }
    setLoading(false);
  };

  const testPDFGeneration = async () => {
    setLoading(true);
    try {
      const testHTML = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
            </style>
          </head>
          <body>
            <h1>Test PDF Generation</h1>
            <p>This is a test PDF to verify the API is working.</p>
            <p>Generated at: ${new Date().toLocaleString()}</p>
          </body>
        </html>
      `;

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: testHTML,
          filename: 'test-cv.pdf'
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'test-cv.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        
        setTestResults(prev => ({ ...prev, pdf: { success: true, message: 'PDF generated and downloaded successfully' } }));
      } else {
        const errorData = await response.json();
        setTestResults(prev => ({ ...prev, pdf: { success: false, error: errorData.message || 'PDF generation failed' } }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, pdf: { success: false, error: error.message } }));
    }
    setLoading(false);
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults({});
    
    await testHealthCheck();
    await testSupabaseConnection();
    await testPDFGeneration();
    
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>API Test Page</h1>
      <p>Use this page to test the various APIs and identify issues.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runAllTests} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Running Tests...' : 'Run All Tests'}
        </button>
        
        <button 
          onClick={testHealthCheck} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Health Check
        </button>
        
        <button 
          onClick={testSupabaseConnection} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#ffc107',
            color: 'black',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Supabase
        </button>
        
        <button 
          onClick={testPDFGeneration} 
          disabled={loading}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          Test PDF Generation
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Test Results:</h2>
        
        {Object.keys(testResults).length === 0 && (
          <p>No tests run yet. Click a button above to start testing.</p>
        )}
        
        {testResults.health && (
          <div style={{ 
            marginBottom: '15px', 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '5px',
            backgroundColor: testResults.health.success ? '#d4edda' : '#f8d7da'
          }}>
            <h3>Health Check API</h3>
            <p><strong>Status:</strong> {testResults.health.success ? '✅ Success' : '❌ Failed'}</p>
            {testResults.health.success ? (
              <pre>{JSON.stringify(testResults.health.data, null, 2)}</pre>
            ) : (
              <p><strong>Error:</strong> {testResults.health.error}</p>
            )}
          </div>
        )}
        
        {testResults.supabase && (
          <div style={{ 
            marginBottom: '15px', 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '5px',
            backgroundColor: testResults.supabase.success ? '#d4edda' : '#f8d7da'
          }}>
            <h3>Supabase Connection</h3>
            <p><strong>Status:</strong> {testResults.supabase.success ? '✅ Success' : '❌ Failed'}</p>
            {testResults.supabase.success ? (
              <pre>{JSON.stringify(testResults.supabase.data, null, 2)}</pre>
            ) : (
              <p><strong>Error:</strong> {testResults.supabase.error}</p>
            )}
          </div>
        )}
        
        {testResults.pdf && (
          <div style={{ 
            marginBottom: '15px', 
            padding: '15px', 
            border: '1px solid #ddd', 
            borderRadius: '5px',
            backgroundColor: testResults.pdf.success ? '#d4edda' : '#f8d7da'
          }}>
            <h3>PDF Generation API</h3>
            <p><strong>Status:</strong> {testResults.pdf.success ? '✅ Success' : '❌ Failed'}</p>
            {testResults.pdf.success ? (
              <p>{testResults.pdf.message}</p>
            ) : (
              <p><strong>Error:</strong> {testResults.pdf.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default APITest; 