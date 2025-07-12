import React from 'react';
import AdminCVSearch from './AdminCVSearch';

const AdminCVEntry = ({ onMakeNewCV, onSelectCV }) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f4f6f8',
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{
        background: '#fff',
        padding: 0,
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        minWidth: 340,
        maxWidth: 900,
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        overflow: 'hidden',
      }}>
        {/* Left: Make New CV */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 32px',
          minWidth: 260,
        }}>
          <h2 style={{ fontWeight: 700, fontSize: 32, color: '#222', marginBottom: 32, textAlign: 'center' }}>
            Admin CV Builder
          </h2>
          <button
            style={{
              padding: '16px 32px',
              fontSize: 20,
              fontWeight: 600,
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              marginBottom: 16,
              width: 220,
              boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
              transition: 'background 0.2s',
            }}
            onClick={onMakeNewCV}
          >
            Make a New CV
          </button>
        </div>
        {/* Divider */}
        <div style={{ width: 1, background: '#e5e7eb', margin: '32px 0' }} />
        {/* Right: Search Existing CV */}
        <div style={{ flex: 2, padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AdminCVSearch onSelectCV={onSelectCV} embedded />
        </div>
      </div>
      <style>{`
        @media (max-width: 700px) {
          .admin-cv-entry-flex {
            flex-direction: column !important;
          }
          .admin-cv-entry-divider {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminCVEntry; 