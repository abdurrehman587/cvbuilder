import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../Supabase/supabase';
import MarketplaceAdmin from '../MarketplaceAdmin/MarketplaceAdmin';
import AdminPanel from '../Supabase/AdminPanel';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('cv-management');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
    // Check URL for section (both clean URL and hash-based routing)
    const updateSectionFromURL = () => {
      const pathname = location.pathname;
      const hash = window.location.hash;
      
      // Check clean URL pathname first
      if (pathname === '/admin' || pathname === '/admin/') {
        setActiveSection('cv-management');
      } else if (pathname.startsWith('/admin/')) {
        // Handle format: /admin/marketplace
        const section = pathname.replace('/admin/', '').split('/')[0];
        if (['marketplace', 'cv-management'].includes(section)) {
          setActiveSection(section);
        }
      }
      // Fallback to hash-based routing for backward compatibility
      else if (hash === '#admin' || hash === '#admin/') {
        setActiveSection('cv-management');
      } else if (hash.startsWith('#admin/')) {
        // Handle format: #admin/marketplace?tab=orders
        const hashWithoutQuery = hash.split('?')[0];
        const section = hashWithoutQuery.replace('#admin/', '').split('/')[0];
        if (['marketplace', 'cv-management'].includes(section)) {
          setActiveSection(section);
        }
      } else if (hash.includes('#admin?tab=')) {
        // Handle format: #admin?tab=orders - default to marketplace for orders tab
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const tabParam = urlParams.get('tab');
        if (tabParam === 'orders') {
          setActiveSection('marketplace');
        }
      }
    };
    
    updateSectionFromURL();
    
    // Listen for hash changes and location changes
    window.addEventListener('hashchange', updateSectionFromURL);
    
    return () => {
      window.removeEventListener('hashchange', updateSectionFromURL);
    };
  }, [location.pathname]);

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
    // Update URL using clean URL routing
    navigate(`/admin/${section}`);
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
    // Navigate back to homepage using clean URL
    navigate('/');
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
            className={activeSection === 'marketplace' ? 'active' : ''}
            onClick={() => handleSectionChange('marketplace')}
          >
            Marketplace Admin
          </button>
          <button
            className={activeSection === 'cv-management' ? 'active' : ''}
            onClick={() => handleSectionChange('cv-management')}
          >
            CV & ID Card Management
          </button>
        </div>
      </div>

      <div className="admin-dashboard-content">
        {activeSection === 'marketplace' && <MarketplaceAdmin />}
        {activeSection === 'cv-management' && <AdminPanel initialView="dashboard" />}
      </div>
    </div>
  );
};

export default AdminDashboard;

