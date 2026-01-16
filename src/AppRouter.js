import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import SEO from './components/SEO/SEO';

// Route wrapper component that adds SEO and handles routing
const RouteWrapper = ({ children, title, description, keywords }) => {
  return (
    <>
      <SEO title={title} description={description} keywords={keywords} />
      {children}
    </>
  );
};

// Main router component
const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Homepage */}
        <Route 
          path="/" 
          element={
            <RouteWrapper 
              title="Online CV Builder in Pakistan | Free Resume Maker - GetGlory" 
              description="Create professional CVs online in Pakistan. Free resume builder with modern templates. Download PDF and print your CV instantly. Get Glory offers the best CV builder and resume maker tools."
              keywords="CV builder, resume builder, online CV builder, free resume maker, CV builder Pakistan, resume templates, professional CV, create CV online, download CV PDF"
            >
              <App />
            </RouteWrapper>
          } 
        />
        
        {/* CV Builder Routes */}
        <Route 
          path="/cv-builder" 
          element={
            <RouteWrapper 
              title="Online CV Builder in Pakistan | Free Resume Maker - GetGlory" 
              description="Create professional CVs online in Pakistan. Free resume builder with modern templates. Download PDF and print your CV instantly. Best CV builder tool for job seekers."
              keywords="CV builder, resume builder, online CV builder, free resume maker, CV builder Pakistan, resume templates, professional CV, create CV online, download CV PDF, CV maker"
            >
              <App />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/resume-templates" 
          element={
            <RouteWrapper 
              title="Resume Templates" 
              description="Browse our collection of professional resume templates. Choose the perfect template for your career."
              keywords="resume templates, CV templates, professional templates, resume design"
            >
              <App />
            </RouteWrapper>
          } 
        />
        
        {/* Marketplace Routes */}
        <Route 
          path="/marketplace" 
          element={
            <RouteWrapper 
              title="Marketplace" 
              description="Explore our marketplace for professional services, templates, and resources for your career needs."
              keywords="marketplace, professional services, career resources, templates"
            >
              <App />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/product/:productId" 
          element={
            <RouteWrapper 
              title="Product Details" 
              description="View product details and specifications."
            >
              <App />
            </RouteWrapper>
          } 
        />
        
        {/* ID Card Routes */}
        <Route 
          path="/id-card-print" 
          element={
            <RouteWrapper 
              title="ID Card Printer" 
              description="Print professional ID cards with our easy-to-use ID card printing utility."
              keywords="ID card printing, ID card maker, ID card generator, professional ID cards"
            >
              <App />
            </RouteWrapper>
          } 
        />
        
        {/* Cart & Checkout */}
        <Route 
          path="/cart" 
          element={
            <RouteWrapper 
              title="Shopping Cart" 
              description="Review your cart items before checkout."
            >
              <App />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/checkout" 
          element={
            <RouteWrapper 
              title="Checkout" 
              description="Complete your purchase securely."
            >
              <App />
            </RouteWrapper>
          } 
        />
        
        {/* Order Routes */}
        <Route 
          path="/orders" 
          element={
            <RouteWrapper 
              title="Order History" 
              description="View your order history and track your purchases."
            >
              <App />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/order/:orderId" 
          element={
            <RouteWrapper 
              title="Order Details" 
              description="View detailed information about your order."
            >
              <App />
            </RouteWrapper>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <RouteWrapper 
              title="Admin Dashboard" 
              description="Admin dashboard for managing the platform."
            >
              <App />
            </RouteWrapper>
          } 
        />
        <Route 
          path="/admin/marketplace" 
          element={
            <RouteWrapper 
              title="Marketplace Admin" 
              description="Manage marketplace products and sections."
            >
              <App />
            </RouteWrapper>
          } 
        />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;

