import React from 'react';
import IDCardPrinter from './src/components/IDCardPrinter';

// Wrapper component to integrate ID Card Print into the main CV Builder app
const IDCardPrintWrapper = () => {
  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'auto' }}>
      <IDCardPrinter />
    </div>
  );
};

export default IDCardPrintWrapper;

