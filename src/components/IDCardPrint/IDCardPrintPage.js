import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Import ID Card Print CSS - this must be imported for styles to work
import './src/index.css';
// Use relative paths with explicit .tsx extensions for TypeScript files
import { TooltipProvider } from '../ui/tooltip.tsx';
import { Toaster } from '../ui/toaster.tsx';
import IDCardPrinter from './src/components/IDCardPrinter.tsx';

const queryClient = new QueryClient();

// Wrapper component for ID Card Print with necessary providers
const IDCardPrintPage = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <IDCardPrinter />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default IDCardPrintPage;
