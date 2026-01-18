import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, authService } from '../Supabase/supabase';
import ShopkeeperProductManager from '../Products/ShopkeeperProductManager';
import './ShopkeeperDashboard.css';

const ShopkeeperDashboard = () => {
  const navigate = useNavigate();
  const [isShopkeeper, setIsShopkeeper] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    checkShopkeeperStatus();
  }, []);

  const checkShopkeeperStatus = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      if (!user) {
        setIsShopkeeper(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Check admin status first
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('is_admin')
        .eq('email', user.email)
        .single();

      if (userError) throw userError;
      const adminStatus = userData?.is_admin || false;
      setIsAdmin(adminStatus);

      // If admin, not a shopkeeper
      if (adminStatus) {
        setIsShopkeeper(false);
        setUserType('admin');
        setLoading(false);
        return;
      }

      // Check shopkeeper status via RPC
      try {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_users_with_type');
        
        if (!rpcError && rpcData) {
          const dbUser = rpcData.find(u => u.email === user.email);
          if (dbUser) {
            const type = dbUser.user_type || 'regular';
            setUserType(type);
            setIsShopkeeper(type === 'shopkeeper');
          } else {
            // Fallback: check user_metadata
            const type = user.user_metadata?.user_type || 'regular';
            setUserType(type);
            setIsShopkeeper(type === 'shopkeeper');
          }
        } else {
          // Fallback: check user_metadata
          const type = user.user_metadata?.user_type || 'regular';
          setUserType(type);
          setIsShopkeeper(type === 'shopkeeper');
        }
      } catch (rpcErr) {
        console.error('Error checking shopkeeper status:', rpcErr);
        // Fallback: check user_metadata
        const type = user.user_metadata?.user_type || 'regular';
        setUserType(type);
        setIsShopkeeper(type === 'shopkeeper');
      }
    } catch (err) {
      console.error('Error checking shopkeeper status:', err);
      setIsShopkeeper(false);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    // Navigate back to homepage
    navigate('/');
    // Optionally set selectedApp to go to marketplace
    localStorage.setItem('selectedApp', 'marketplace');
  };

  if (loading) {
    return (
      <div className="shopkeeper-dashboard-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="shopkeeper-dashboard-error">
        <h2>Access Denied</h2>
        <p>You are logged in as an Admin. Please use the Admin Panel instead.</p>
        <button onClick={() => navigate('/admin')}>Go to Admin Panel</button>
      </div>
    );
  }

  if (!isShopkeeper) {
    return (
      <div className="shopkeeper-dashboard-error">
        <h2>Access Denied</h2>
        <p>You do not have shopkeeper privileges. Your account type is: {userType || 'regular'}</p>
        <button onClick={() => navigate('/')}>Go to Home</button>
      </div>
    );
  }

  return (
    <div className="shopkeeper-dashboard">
      <div className="shopkeeper-dashboard-header">
        <div className="shopkeeper-header-top">
          <button 
            className="shopkeeper-back-button"
            onClick={handleBack}
            title="Go Back"
          >
            ← Back
          </button>
          <h1>Shopkeeper Panel</h1>
        </div>
      </div>

      <div className="shopkeeper-dashboard-content">
        <ShopkeeperProductManager 
          onProductAdded={() => {
            // Reload can be handled by the component itself
            console.log('Product added/updated');
          }}
        />
      </div>
    </div>
  );
};

export default ShopkeeperDashboard;
