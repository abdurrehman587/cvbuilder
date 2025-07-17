import React, { useState, useEffect } from 'react';
import supabase from './supabase';

const PaymentTest = ({ templateId }) => {
  const [userEmail, setUserEmail] = useState('');
  const [testResults, setTestResults] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        runTests(user.email);
      }
    };
    getUser();
  }, [templateId]);

  const runTests = async (email) => {
    if (!email || !templateId) return;

    try {
      setIsLoading(true);
      console.log('PaymentTest - Running tests for:', { email, templateId });

      // Test 1: Direct database query for approved payments
      const { data: directPayments, error: directError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', email)
        .eq('template_id', templateId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('PaymentTest - Direct query result:', { directPayments, directError });

      // Test 2: Check database ready
      const dbReady = await checkDatabaseReady();
      console.log('PaymentTest - Database ready:', dbReady);

      // Test 3: Check user authentication
      const { data: { user } } = await supabase.auth.getUser();
      console.log('PaymentTest - User auth:', user);

      // Test 4: Check all payments
      const { data: allPayments, error: allError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_email', email)
        .eq('template_id', templateId);

      console.log('PaymentTest - All payments:', { allPayments, allError });

      setTestResults({
        directPayments: directPayments || [],
        directError: directError?.message || null,
        dbReady: dbReady,
        userAuth: user ? 'Authenticated' : 'Not authenticated',
        allPayments: allPayments || [],
        allError: allError?.message || null
      });

    } catch (error) {
      console.error('PaymentTest - Error:', error);
      setTestResults({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const checkDatabaseReady = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Database not ready:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Database check error:', error);
      return false;
    }
  };

  if (isLoading) {
    return <div>Running payment tests...</div>;
  }

  return (
    <div style={{
      padding: '10px',
      backgroundColor: '#e3f2fd',
      border: '1px solid #2196f3',
      borderRadius: '4px',
      margin: '10px 0',
      fontSize: '12px'
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>🧪 Payment Test Results</h4>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>User:</strong> {userEmail}<br/>
        <strong>Template:</strong> {templateId}
      </div>

      {testResults.error ? (
        <div style={{ color: '#d32f2f' }}>
          ❌ Test Error: {testResults.error}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '6px' }}>
            <strong>Database Ready:</strong> {testResults.dbReady ? '✅ Yes' : '❌ No'}<br/>
            <strong>User Auth:</strong> {testResults.userAuth}<br/>
            <strong>Total Payments:</strong> {testResults.allPayments?.length || 0}
          </div>

          <div style={{ marginBottom: '6px' }}>
            <strong>Direct Query Result:</strong><br/>
            {testResults.directError ? (
              <span style={{ color: '#d32f2f' }}>❌ Error: {testResults.directError}</span>
            ) : (
              <span style={{ color: '#2e7d32' }}>
                ✅ Found {testResults.directPayments?.length || 0} approved payments
              </span>
            )}
          </div>

          {testResults.directPayments?.length > 0 && (
                         <div style={{
               padding: '6px',
               backgroundColor: '#c8e6c9',
               border: '1px solid #4caf50',
               borderRadius: '3px',
               fontSize: '11px'
             }}>
               <strong>Latest Approved Payment:</strong><br/>
               ID: {testResults.directPayments[0].id}<br/>
               Status: {testResults.directPayments[0].status}<br/>
               Amount: PKR {testResults.directPayments[0].amount}
             </div>
          )}

                     {testResults.allPayments?.length > 0 && (
             <div style={{ marginTop: '6px' }}>
               <strong>All Payments Summary:</strong><br/>
               Approved: {testResults.allPayments.filter(p => p.status === 'approved').length}<br/>
               Pending: {testResults.allPayments.filter(p => p.status === 'pending').length}
             </div>
           )}
        </div>
      )}

      <div style={{ marginTop: '8px' }}>
        <button
          onClick={() => runTests(userEmail)}
          style={{
            padding: '4px 8px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          🔄 Run Tests Again
        </button>
      </div>
    </div>
  );
};

export default PaymentTest; 