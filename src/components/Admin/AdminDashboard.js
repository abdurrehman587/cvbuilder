import React, { useState, useEffect } from 'react';
import { supabase } from '../Supabase/supabase';
import MarketplaceAdmin from '../MarketplaceAdmin/MarketplaceAdmin';
import AdminPanel from '../Supabase/AdminPanel';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
    // Check URL hash for section
    const updateSectionFromHash = () => {
      const hash = window.location.hash;
      if (hash === '#admin' || hash === '#admin/') {
        setActiveSection('dashboard');
      } else if (hash.startsWith('#admin/')) {
        const section = hash.replace('#admin/', '').split('/')[0];
        if (['marketplace', 'cv-management', 'dashboard'].includes(section)) {
          setActiveSection(section);
        }
      }
    };
    
    updateSectionFromHash();
    
    // Listen for hash changes
    window.addEventListener('hashchange', updateSectionFromHash);
    
    return () => {
      window.removeEventListener('hashchange', updateSectionFromHash);
    };
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('is_admin')
        .eq('email', user.email)
        .single();

      if (error) throw error;
      setIsAdmin(data?.is_admin || false);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    // Update URL hash
    if (section === 'dashboard') {
      window.location.hash = '#admin';
    } else {
      window.location.hash = `#admin/${section}`;
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-dashboard-error">
        <h2>Access Denied</h2>
        <p>You do not have administrator privileges.</p>
        <button onClick={() => window.location.href = '/'}>Go to Home</button>
      </div>
    );
  }

  const handleBack = () => {
    // Clear admin hash and navigate back
    window.location.hash = '';
    // Optionally set selectedApp to go to a specific section
    const savedApp = localStorage.getItem('selectedApp') || 'cv-builder';
    localStorage.setItem('selectedApp', savedApp);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div className="admin-header-top">
          <button 
            className="admin-back-button"
            onClick={handleBack}
            title="Go Back"
          >
            ← Back
          </button>
          <h1>Admin Dashboard</h1>
        </div>
        <div className="admin-nav">
          <button
            className={activeSection === 'dashboard' ? 'active' : ''}
            onClick={() => handleSectionChange('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeSection === 'marketplace' ? 'active' : ''}
            onClick={() => handleSectionChange('marketplace')}
          >
            Marketplace Admin
          </button>
          <button
            className={activeSection === 'cv-management' ? 'active' : ''}
            onClick={() => handleSectionChange('cv-management')}
          >
            CV Management
          </button>
        </div>
      </div>

      <div className="admin-dashboard-content">
        {activeSection === 'dashboard' && (
          <div className="admin-dashboard-overview">
            <h2>Welcome to Admin Dashboard</h2>
            <div className="admin-dashboard-cards">
              <div className="admin-card" onClick={() => handleSectionChange('marketplace')}>
                <h3>Marketplace Admin</h3>
                <p>Manage products, orders, and marketplace settings</p>
                <button>Go to Marketplace Admin</button>
              </div>
              <div className="admin-card" onClick={() => handleSectionChange('cv-management')}>
                <h3>CV Management</h3>
                <p>Manage users and CVs</p>
                <button>Go to CV Management</button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'marketplace' && <MarketplaceAdmin />}
        {activeSection === 'cv-management' && <AdminPanel initialView="dashboard" />}
      </div>
    </div>
  );
};

export default AdminDashboard;

