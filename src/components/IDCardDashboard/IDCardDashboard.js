import React from 'react';
import './IDCardDashboard.css';

const IDCardDashboard = ({ onCreateNewIDCard }) => {
  const handleCreateNewIDCard = () => {
    if (onCreateNewIDCard) {
      onCreateNewIDCard();
    } else {
      // Fallback: navigate to ID Card Print page
      window.location.href = '/';
    }
  };

  return (
    <div className="id-card-dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>My ID Card Dashboard</h1>
          <p className="welcome-message">Welcome! Let's create your professional ID cards</p>
          <p className="sub-message">Print multiple ID cards on A4 paper with perfect alignment</p>
        </div>
      </div>
      
      <div className="dashboard-options">
        <div className="option-card" onClick={handleCreateNewIDCard}>
          <div className="option-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </div>
          <h3>Get Your ID Card Ready for Printing.</h3>
          <p>Start creating ID cards with front and back printing support</p>
        </div>
      </div>
    </div>
  );
};

export default IDCardDashboard;

