import React, { useState, useEffect } from 'react';
import supabase from './supabase';
import PaymentAdmin from './PaymentAdmin';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Custom hook for responsive design
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const SignupSignIn = ({ onAuth }) => {
  const { width: windowWidth } = useWindowSize();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [userType, setUserType] = useState('user'); // 'user' or 'admin'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminToggle, setShowAdminToggle] = useState(true);
  const [adminAccessAttempts, setAdminAccessAttempts] = useState(0);

  // Admin credentials (in production, this should be in environment variables)
  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || 'admin@cvbuilder.com';
  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123456';

  useEffect(() => {
    // Handle automatic sign-out only when browser is actually closing (not tab switching)
    const handleBeforeUnload = () => {
      // Clear user-specific localStorage data but preserve payment records and user object
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('payment_') && key !== 'user') {
          keysToRemove.push(key);
        }
      }
      
      // Remove only user-specific data, preserve payment records and user object
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Sign out from Supabase
      supabase.auth.signOut();
    };

    // Handle keyboard shortcuts for admin access
    const handleKeyPress = (e) => {
      // Ctrl + Alt + A to toggle admin access (hidden feature)
      if (e.ctrlKey && e.altKey && e.key === 'a') {
        e.preventDefault();
        setShowAdminToggle(!showAdminToggle);
      }
    };

    // Add event listeners - only for actual browser close, not tab switching
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [showAdminToggle]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setShowResend(false);
    setLoading(true);
    
    console.log('=== AUTHENTICATION START ===');
    console.log('SignupSignIn - Mode:', mode);
    console.log('SignupSignIn - UserType:', userType);
    console.log('SignupSignIn - Email:', email);
    console.log('SignupSignIn - Password length:', password.length);
    
    try {
      // Check if this is an admin login attempt
      if (userType === 'admin') {
        console.log('SignupSignIn - Admin login attempt');
        // Rate limiting for admin access attempts
        if (adminAccessAttempts >= 3) {
          console.log('SignupSignIn - Too many admin attempts');
          setError('Too many admin access attempts. Please try again later.');
          setLoading(false);
          return;
        }

        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          console.log('SignupSignIn - Admin login successful');
          // Create admin user object
          const adminUser = {
            id: 'admin-user',
            email: ADMIN_EMAIL,
            user_metadata: { role: 'admin' },
            isAdmin: true
          };
          onAuth(adminUser);
          // Store admin user object in localStorage for payment utilities
          localStorage.setItem('user', JSON.stringify(adminUser));
          setShowAdminPanel(true);
          setAdminAccessAttempts(0); // Reset attempts on successful login
          return;
        } else {
          console.log('SignupSignIn - Admin login failed');
          setAdminAccessAttempts(prev => prev + 1);
          const remainingAttempts = 3 - adminAccessAttempts - 1;
          setError(`Invalid admin credentials. ${remainingAttempts > 0 ? `${remainingAttempts} attempts remaining.` : 'No attempts remaining.'}`);
          setLoading(false);
          return;
        }
      }

      // Regular user authentication
      console.log('SignupSignIn - Regular user authentication');
      let result;
      if (mode === 'signup') {
        console.log('SignupSignIn - Attempting signup');
        result = await supabase.auth.signUp({ email, password });
      } else {
        console.log('SignupSignIn - Attempting signin');
        result = await supabase.auth.signInWithPassword({ email, password });
      }
      
      console.log('SignupSignIn - Auth result:', result);
      
      if (result.error) {
        console.log('SignupSignIn - Auth error:', result.error);
        setError(result.error.message);
        if (result.error.message.toLowerCase().includes('email not confirmed')) {
          setShowResend(true);
        }
      } else if (result.data?.user) {
        console.log('SignupSignIn - Auth successful, user:', result.data.user);
        // Add user type to user object
        const userWithType = {
          ...result.data.user,
          userType: 'user',
          isAdmin: false
        };
        onAuth(userWithType);
        // Store user object in localStorage for payment utilities
        localStorage.setItem('user', JSON.stringify(userWithType));
      }
    } catch (err) {
      console.log('SignupSignIn - Auth exception:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      console.log('=== AUTHENTICATION END ===');
    }
  };



  const handleResend = async () => {
    setError('');
    setShowResend(false);
    setError('Please check your email inbox and spam folder for the confirmation email. If you did not receive it, try signing up again or contact support.');
  };

  const handleBackToLogin = () => {
    setShowAdminPanel(false);
    setUserType('user');
    setEmail('');
    setPassword('');
    setError('');
    // Clear admin access when going back to login
    localStorage.removeItem('admin_cv_access');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_selected_cv');
  };

  // If admin panel is shown, render the admin interface
  if (showAdminPanel) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f5f6fa',
        position: 'relative'
      }}>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          style={{ zIndex: 9999 }}
        />
        <button
          onClick={handleBackToLogin}
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 1000,
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: "'Inter', sans-serif"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          ← Back to Login
        </button>
        


        <PaymentAdmin />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: windowWidth < 768 ? '100dvh' : '100vh', 
      display: 'flex', 
      alignItems: 'flex-start', 
      justifyContent: 'center',
      background: `
        linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)
      `,
      padding: windowWidth < 480 ? '15px' : windowWidth < 768 ? '20px' : windowWidth < 1366 ? '25px' : '30px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Modern Background Elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        {/* Animated gradient mesh */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.03) 0%, transparent 50%)
          `,
          animation: 'meshMove 20s ease-in-out infinite',
        }} />
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: `${20 + i * 15}%`,
            left: `${10 + i * 20}%`,
            width: windowWidth < 768 ? '4px' : '6px',
            height: windowWidth < 768 ? '4px' : '6px',
            background: i % 3 === 0 ? 'rgba(59, 130, 246, 0.3)' : i % 3 === 1 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
            borderRadius: '50%',
            animation: `float ${8 + i * 2}s ease-in-out infinite`,
            animationDelay: `${i * 0.5}s`,
          }} />
        ))}
        
        {/* Geometric shapes */}
        <div style={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: windowWidth < 768 ? '60px' : '100px',
          height: windowWidth < 768 ? '60px' : '100px',
          background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.03))',
          borderRadius: '20px',
          transform: 'rotate(45deg)',
          animation: 'rotate 15s linear infinite',
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '8%',
          width: windowWidth < 768 ? '40px' : '80px',
          height: windowWidth < 768 ? '40px' : '80px',
          background: 'linear-gradient(45deg, rgba(16, 185, 129, 0.06), rgba(16, 185, 129, 0.02))',
          borderRadius: '50%',
          animation: 'pulse 6s ease-in-out infinite',
        }} />
      </div>
      
      {/* Main Content Container - Modern Card Layout */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: windowWidth < 480 ? '20px' : windowWidth < 768 ? '30px' : windowWidth < 1024 ? '40px' : windowWidth < 1366 ? '50px' : '80px',
        maxWidth: windowWidth < 1366 ? '1200px' : '1400px',
        width: '100%',
        zIndex: 1,
        position: 'relative',
        flexDirection: windowWidth < 1024 ? 'column' : 'row',
        padding: windowWidth < 480 ? '10px' : windowWidth < 768 ? '20px' : windowWidth < 1366 ? '25px' : '30px',
      }}>
        
        {/* Left Side - Modern White Card */}
        <div style={{
          flex: 1,
          color: '#1f2937',
          maxWidth: windowWidth < 1024 ? '100%' : windowWidth < 1366 ? '550px' : '600px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: windowWidth < 480 ? '20px' : windowWidth < 768 ? '25px' : windowWidth < 1366 ? '28px' : '30px',
          border: '1px solid rgba(229, 231, 235, 0.8)',
          padding: windowWidth < 480 ? '20px' : windowWidth < 768 ? '30px' : windowWidth < 1366 ? '35px' : '40px',
          order: windowWidth < 1024 ? 2 : 1,
          textAlign: windowWidth < 1024 ? 'center' : 'left',
          width: '100%',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Card inner glow */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, transparent 50%)',
            borderRadius: 'inherit',
            pointerEvents: 'none',
          }} />
          
          <h1 style={{
            fontSize: windowWidth < 480 ? '2.5rem' : windowWidth < 768 ? '3.2rem' : windowWidth < 1024 ? '3.5rem' : windowWidth < 1366 ? '3.8rem' : '4.2rem',
            fontWeight: 800,
            margin: windowWidth < 480 ? '0 5px 8px 5px' : windowWidth < 768 ? '0 8px 12px 8px' : windowWidth < 1366 ? '0 10px 15px 10px' : '0 10px 15px 10px',
            lineHeight: 1.1,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            color: '#10b981',
            textAlign: 'center',
            fontFamily: "'Playfair Display', 'Georgia', serif",
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Make CV by Yourself
          </h1>
          
          {/* Border Line */}
          <div style={{
            height: '4px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.6) 50%, transparent 100%)',
            margin: windowWidth < 480 ? '8px 20px' : windowWidth < 768 ? '12px 30px' : windowWidth < 1366 ? '15px 40px' : '15px 40px',
            borderRadius: '4px',
          }} />
          
          {/* Call-to-Action Text */}
          <div style={{
            fontSize: windowWidth < 480 ? '1.2rem' : windowWidth < 768 ? '1.6rem' : windowWidth < 1024 ? '1.8rem' : windowWidth < 1366 ? '2rem' : '2.2rem',
            margin: windowWidth < 480 ? '8px 5px' : windowWidth < 768 ? '12px 8px' : windowWidth < 1366 ? '15px 10px' : '15px 10px',
            fontWeight: 700,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            color: '#10b981',
            textAlign: 'center',
            fontFamily: "'Playfair Display', 'Georgia', serif",
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1.3,
          }}>
            📝 Fill the form and<br />
            Get Your CV Ready
          </div>
          
          {/* Redesigned Features Presentation */}
          {/* Modern Features Section */}
          <div style={{
            marginTop: windowWidth < 480 ? '20px' : windowWidth < 768 ? '25px' : windowWidth < 1366 ? '30px' : '35px',
            color: '#ffffff',
          }}>
            {/* Features Grid - Modern Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: windowWidth < 480 ? '1fr' : windowWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
              gap: windowWidth < 480 ? '8px' : windowWidth < 768 ? '10px' : '12px',
            }}>
                              <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  fontSize: windowWidth < 480 ? '16px' : windowWidth < 768 ? '18px' : windowWidth < 1366 ? '19px' : '20px',
                  color: '#374151',
                  fontWeight: 500,
                  padding: windowWidth < 480 ? '10px 14px' : windowWidth < 768 ? '12px 18px' : windowWidth < 1366 ? '14px 22px' : '16px 26px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: windowWidth < 480 ? '12px' : windowWidth < 768 ? '15px' : windowWidth < 1366 ? '16px' : '18px',
                  border: '1px solid rgba(229, 231, 235, 0.8)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                                   <span style={{ 
                   color: '#10b981', 
                   fontSize: windowWidth < 480 ? '28px' : windowWidth < 768 ? '32px' : windowWidth < 1366 ? '34px' : '36px',
                   fontWeight: 'bold',
                   filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))',
                 }}>✓</span>
                 Simple step-by-step process
                </div>
                             <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '15px',
                 fontSize: windowWidth < 480 ? '16px' : windowWidth < 768 ? '18px' : '20px',
                 color: '#374151',
                 fontWeight: 500,
                 padding: windowWidth < 480 ? '15px 20px' : windowWidth < 768 ? '18px 25px' : '20px 30px',
                 background: 'rgba(255, 255, 255, 0.8)',
                 borderRadius: windowWidth < 480 ? '12px' : windowWidth < 768 ? '15px' : '18px',
                 border: '1px solid rgba(229, 231, 235, 0.8)',
                 backdropFilter: 'blur(10px)',
                 transition: 'all 0.3s ease',
                 cursor: 'pointer',
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                 e.currentTarget.style.transform = 'translateY(-2px)';
                 e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = 'none';
               }}
               >
                 <span style={{ 
                   color: '#10b981', 
                   fontSize: windowWidth < 480 ? '28px' : windowWidth < 768 ? '32px' : windowWidth < 1366 ? '34px' : '36px',
                   fontWeight: 'bold',
                   filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))',
                 }}>✓</span>
                 Live results
               </div>
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '15px',
                 fontSize: windowWidth < 480 ? '16px' : windowWidth < 768 ? '18px' : '20px',
                 color: '#374151',
                 fontWeight: 500,
                 padding: windowWidth < 480 ? '15px 20px' : windowWidth < 768 ? '18px 25px' : '20px 30px',
                 background: 'rgba(255, 255, 255, 0.8)',
                 borderRadius: windowWidth < 480 ? '12px' : windowWidth < 768 ? '15px' : '18px',
                 border: '1px solid rgba(229, 231, 235, 0.8)',
                 backdropFilter: 'blur(10px)',
                 transition: 'all 0.3s ease',
                 cursor: 'pointer',
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                 e.currentTarget.style.transform = 'translateY(-2px)';
                 e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = 'none';
               }}
               >
                 <span style={{ 
                   color: '#10b981', 
                   fontSize: windowWidth < 480 ? '28px' : windowWidth < 768 ? '32px' : windowWidth < 1366 ? '34px' : '36px',
                   fontWeight: 'bold',
                   filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))',
                 }}>✓</span>
                 High Quality PDF
               </div>
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '15px',
                 fontSize: windowWidth < 480 ? '16px' : windowWidth < 768 ? '18px' : '20px',
                 color: '#374151',
                 fontWeight: 500,
                 padding: windowWidth < 480 ? '15px 20px' : windowWidth < 768 ? '18px 25px' : '20px 30px',
                 background: 'rgba(255, 255, 255, 0.8)',
                 borderRadius: windowWidth < 480 ? '12px' : windowWidth < 768 ? '15px' : '18px',
                 border: '1px solid rgba(229, 231, 235, 0.8)',
                 backdropFilter: 'blur(10px)',
                 transition: 'all 0.3s ease',
                 cursor: 'pointer',
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                 e.currentTarget.style.transform = 'translateY(-2px)';
                 e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = 'none';
               }}
               >
                 <span style={{ 
                   color: '#10b981', 
                   fontSize: windowWidth < 480 ? '28px' : windowWidth < 768 ? '32px' : windowWidth < 1366 ? '34px' : '36px',
                   fontWeight: 'bold',
                   filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))',
                 }}>✓</span>
                 Auto Save
               </div>
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '15px',
                 fontSize: windowWidth < 480 ? '16px' : windowWidth < 768 ? '18px' : '20px',
                 color: '#374151',
                 fontWeight: 500,
                 padding: windowWidth < 480 ? '15px 20px' : windowWidth < 768 ? '18px 25px' : '20px 30px',
                 background: 'rgba(255, 255, 255, 0.8)',
                 borderRadius: windowWidth < 480 ? '12px' : windowWidth < 768 ? '15px' : '18px',
                 border: '1px solid rgba(229, 231, 235, 0.8)',
                 backdropFilter: 'blur(10px)',
                 transition: 'all 0.3s ease',
                 cursor: 'pointer',
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                 e.currentTarget.style.transform = 'translateY(-2px)';
                 e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = 'none';
               }}
               >
                 <span style={{ 
                   color: '#10b981', 
                   fontSize: windowWidth < 480 ? '28px' : windowWidth < 768 ? '32px' : windowWidth < 1366 ? '34px' : '36px',
                   fontWeight: 'bold',
                   filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))',
                 }}>✓</span>
                 No complex editing
               </div>
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '15px',
                 fontSize: windowWidth < 480 ? '16px' : windowWidth < 768 ? '18px' : '20px',
                 color: '#374151',
                 fontWeight: 500,
                 padding: windowWidth < 480 ? '15px 20px' : windowWidth < 768 ? '18px 25px' : '20px 30px',
                 background: 'rgba(255, 255, 255, 0.8)',
                 borderRadius: windowWidth < 480 ? '12px' : windowWidth < 768 ? '15px' : '18px',
                 border: '1px solid rgba(229, 231, 235, 0.8)',
                 backdropFilter: 'blur(10px)',
                 transition: 'all 0.3s ease',
                 cursor: 'pointer',
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                 e.currentTarget.style.transform = 'translateY(-2px)';
                 e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = 'none';
               }}
               >
                 <span style={{ 
                   color: '#10b981', 
                   fontSize: windowWidth < 480 ? '28px' : windowWidth < 768 ? '32px' : windowWidth < 1366 ? '34px' : '36px',
                   fontWeight: 'bold',
                   filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))',
                 }}>✓</span>
                 10+ Professional templates
               </div>
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '15px',
                 fontSize: windowWidth < 480 ? '16px' : windowWidth < 768 ? '18px' : '20px',
                 color: '#374151',
                 fontWeight: 500,
                 padding: windowWidth < 480 ? '15px 20px' : windowWidth < 768 ? '18px 25px' : '20px 30px',
                 background: 'rgba(255, 255, 255, 0.8)',
                 borderRadius: windowWidth < 480 ? '12px' : windowWidth < 768 ? '15px' : '18px',
                 border: '1px solid rgba(229, 231, 235, 0.8)',
                 backdropFilter: 'blur(10px)',
                 transition: 'all 0.3s ease',
                 cursor: 'pointer',
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                 e.currentTarget.style.transform = 'translateY(-2px)';
                 e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = 'none';
               }}
               >
                 <span style={{ 
                   color: '#10b981', 
                   fontSize: windowWidth < 480 ? '28px' : windowWidth < 768 ? '32px' : windowWidth < 1366 ? '34px' : '36px',
                   fontWeight: 'bold',
                   filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))',
                 }}>✓</span>
                 Mobile Friendly
               </div>
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '15px',
                 fontSize: windowWidth < 480 ? '16px' : windowWidth < 768 ? '18px' : '20px',
                 color: '#374151',
                 fontWeight: 500,
                 padding: windowWidth < 480 ? '15px 20px' : windowWidth < 768 ? '18px 25px' : '20px 30px',
                 background: 'rgba(255, 255, 255, 0.8)',
                 borderRadius: windowWidth < 480 ? '12px' : windowWidth < 768 ? '15px' : '18px',
                 border: '1px solid rgba(229, 231, 235, 0.8)',
                 backdropFilter: 'blur(10px)',
                 transition: 'all 0.3s ease',
                 cursor: 'pointer',
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                 e.currentTarget.style.transform = 'translateY(-2px)';
                 e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = 'none';
               }}
               >
                 <span style={{ 
                   color: '#10b981', 
                   fontSize: windowWidth < 480 ? '28px' : windowWidth < 768 ? '32px' : windowWidth < 1366 ? '34px' : '36px',
                   fontWeight: 'bold',
                   filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))',
                 }}>✓</span>
                 Trusted by thousands
               </div>
            </div>
            
          </div>
          

        </div>
        
        {/* Right Side - Modern Auth Form */}
        <div style={{
          flex: '0 0 auto',
          minWidth: windowWidth < 768 ? '100%' : windowWidth < 1366 ? '420px' : '450px',
          width: windowWidth < 768 ? '100%' : 'auto',
          order: windowWidth < 1024 ? 1 : 2,
          maxWidth: windowWidth < 768 ? '100%' : windowWidth < 1366 ? '470px' : '500px',
          margin: windowWidth < 480 ? '0' : 'auto',
        }}>
                <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            style={{ zIndex: 9999 }}
          />
          
          {/* Modern White Auth Form */}
          <form onSubmit={handleAuth} className="auth-form" style={{
            background: 'rgba(255, 255, 255, 0.95)', 
            padding: windowWidth < 480 ? '25px' : windowWidth < 768 ? '35px' : windowWidth < 1366 ? '40px' : '50px', 
            borderRadius: windowWidth < 480 ? '20px' : windowWidth < 768 ? '25px' : windowWidth < 1366 ? '28px' : '30px', 
            boxShadow: '0 25px 50px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            minWidth: windowWidth < 768 ? '100%' : windowWidth < 1366 ? '420px' : '450px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: windowWidth < 480 ? '15px' : windowWidth < 768 ? '20px' : windowWidth < 1366 ? '22px' : '25px',
            width: '100%',
            maxWidth: windowWidth < 768 ? '100%' : windowWidth < 1366 ? '470px' : '500px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Form inner glow */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, transparent 50%)',
              borderRadius: 'inherit',
              pointerEvents: 'none',
            }} />
            {/* Form Header - Responsive */}
            <div style={{ textAlign: 'center', marginBottom: windowWidth < 480 ? '6px' : windowWidth < 768 ? '8px' : windowWidth < 1366 ? '9px' : '10px' }}>
              <h2 className="auth-title" style={{ 
                margin: '0 0 8px 0', 
                fontSize: windowWidth < 480 ? '1.3rem' : windowWidth < 768 ? '1.5rem' : windowWidth < 1366 ? '1.8rem' : '2rem',
                fontWeight: 700,
                color: mode === 'signup' ? '#059669' : '#1f2937',
                transition: 'color 0.3s ease',
              }}>
                {userType === 'admin' ? '🔐 Admin Login' : (mode === 'signup' ? 'Create Account' : 'Welcome Back')}
              </h2>
              <p style={{
                margin: 0,
                color: mode === 'signup' ? '#047857' : '#6b7280',
                fontSize: windowWidth < 480 ? '0.8rem' : windowWidth < 768 ? '0.9rem' : windowWidth < 1366 ? '0.95rem' : '1rem',
                transition: 'color 0.3s ease',
              }}>
                {userType === 'admin' ? 'Access admin panel' : (mode === 'signup' ? 'Start building your professional CV' : 'Sign in to continue')}
              </p>
            </div>

            {/* Enhanced Admin Toggle - Responsive */}
            <div className="auth-toggle" style={{
              display: 'flex',
              borderRadius: windowWidth < 480 ? '8px' : windowWidth < 768 ? '8px' : '12px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden',
              marginBottom: windowWidth < 480 ? '12px' : windowWidth < 768 ? '16px' : '20px',
              opacity: showAdminToggle ? 1 : 0.1,
              transition: 'opacity 0.3s ease',
              pointerEvents: showAdminToggle ? 'auto' : 'none',
              background: '#f9fafb',
            }}>
          <button
            type="button"
            onClick={() => {
              setUserType('user');
              setAdminAccessAttempts(0); // Reset attempts when switching to user mode
            }}
            style={{
              flex: 1,
              padding: windowWidth < 480 ? '12px 10px' : '10px',
              border: 'none',
              background: userType === 'user' ? '#3f51b5' : '#f9fafb',
              color: userType === 'user' ? 'white' : '#374151',
              cursor: 'pointer',
              fontWeight: userType === 'user' ? '600' : '400',
              transition: 'all 0.2s ease',
              minHeight: windowWidth < 480 ? '44px' : 'auto',
              fontSize: windowWidth < 480 ? '14px' : 'inherit',
            }}
          >
            👤 User
          </button>
          <button
            type="button"
            onClick={() => setUserType('admin')}
            style={{
              flex: 1,
              padding: windowWidth < 480 ? '12px 10px' : '10px',
              border: 'none',
              background: userType === 'admin' ? '#dc2626' : '#f9fafb',
              color: userType === 'admin' ? 'white' : '#374151',
              cursor: 'pointer',
              fontWeight: userType === 'admin' ? '600' : '400',
              transition: 'all 0.2s ease',
              minHeight: windowWidth < 480 ? '44px' : 'auto',
              fontSize: windowWidth < 480 ? '14px' : 'inherit',
            }}
          >
            🔐 Admin
          </button>
        </div>

            {/* Enhanced Input Fields */}
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                required
                disabled={loading}
                onChange={e => setEmail(e.target.value)}
                className="auth-input"
                style={{ 
                  width: '100%',
                  padding: windowWidth < 480 ? '14px 16px' : windowWidth < 768 ? '14px 16px' : windowWidth < 1366 ? '15px 18px' : '16px 20px', 
                  borderRadius: windowWidth < 480 ? '8px' : windowWidth < 768 ? '8px' : windowWidth < 1366 ? '10px' : '12px', 
                  border: '2px solid #e5e7eb',
                  fontSize: windowWidth < 480 ? '16px' : windowWidth < 768 ? '14px' : windowWidth < 1366 ? '15px' : '16px',
                  background: '#fff',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                  minHeight: windowWidth < 480 ? '48px' : 'auto',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                required
                disabled={loading}
                onChange={e => setPassword(e.target.value)}
                className="auth-input"
                style={{ 
                  width: '100%',
                  padding: windowWidth < 480 ? '14px 16px' : windowWidth < 768 ? '14px 16px' : windowWidth < 1366 ? '15px 18px' : '16px 20px', 
                  borderRadius: windowWidth < 480 ? '8px' : windowWidth < 768 ? '8px' : windowWidth < 1366 ? '10px' : '12px', 
                  border: '2px solid #e5e7eb',
                  fontSize: windowWidth < 480 ? '16px' : windowWidth < 768 ? '14px' : windowWidth < 1366 ? '15px' : '16px',
                  background: '#fff',
                  transition: 'all 0.3s ease',
                  boxSizing: 'border-box',
                  minHeight: windowWidth < 480 ? '48px' : 'auto',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
                    {/* Error Message - Responsive */}
            {error && (
              <div style={{ 
                color: '#dc2626', 
                fontSize: windowWidth < 480 ? '11px' : windowWidth < 768 ? '12px' : '14px',
                padding: windowWidth < 480 ? '8px 10px' : windowWidth < 768 ? '10px 12px' : '12px 16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: windowWidth < 480 ? '4px' : windowWidth < 768 ? '6px' : '8px',
                marginBottom: windowWidth < 480 ? '6px' : windowWidth < 768 ? '8px' : '10px',
              }}>
                {error}
              </div>
            )}
            
            {/* Resend Email Button */}
            {showResend && (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: loading ? 0.6 : 1,
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = '#1d4ed8';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = '#2563eb';
                }}
              >
                I did not receive the confirmation email
              </button>
            )}
            
            {/* Enhanced Submit Button - Responsive */}
            <button 
              type="submit" 
              disabled={loading}
              className="auth-button"
              style={{
                padding: windowWidth < 480 ? '14px 16px' : windowWidth < 768 ? '14px 20px' : '16px 24px', 
                borderRadius: windowWidth < 480 ? '8px' : windowWidth < 768 ? '8px' : '12px', 
                border: 'none', 
                background: loading ? '#9ca3af' : (userType === 'admin' ? '#dc2626' : (mode === 'signup' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')), 
                color: '#fff', 
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: windowWidth < 480 ? '16px' : windowWidth < 768 ? '14px' : '16px',
                transition: 'all 0.3s ease',
                boxShadow: loading ? 'none' : (mode === 'signup' ? '0 4px 12px rgba(5, 150, 105, 0.3)' : '0 4px 12px rgba(102, 126, 234, 0.3)'),
                width: '100%',
                minHeight: windowWidth < 480 ? '48px' : 'auto',
              }}
              onMouseEnter={(e) => {
                if (!loading && userType !== 'admin') {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = mode === 'signup' ? '0 6px 20px rgba(5, 150, 105, 0.4)' : '0 6px 20px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && userType !== 'admin') {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = mode === 'signup' ? '0 4px 12px rgba(5, 150, 105, 0.3)' : '0 4px 12px rgba(102, 126, 234, 0.3)';
                }
              }}
            >
              {loading ? 'Loading...' : (userType === 'admin' ? 'Admin Login' : (mode === 'signup' ? 'Create Account' : 'Sign In'))}
            </button>
            
            {/* Enhanced Toggle Links - Responsive */}
            {userType === 'user' && (
              <div style={{ 
                textAlign: 'center', 
                fontSize: windowWidth < 480 ? '11px' : windowWidth < 768 ? '12px' : '14px',
                marginTop: windowWidth < 480 ? '12px' : windowWidth < 768 ? '16px' : '20px',
                padding: windowWidth < 480 ? '10px' : windowWidth < 768 ? '12px' : '16px',
                background: mode === 'signup' ? '#f0fdf4' : '#f9fafb',
                borderRadius: windowWidth < 480 ? '6px' : windowWidth < 768 ? '8px' : '12px',
                border: mode === 'signup' ? '1px solid #bbf7d0' : '1px solid #e5e7eb',
                transition: 'all 0.3s ease',
              }}>
                {mode === 'signup'
                  ? <>Already have an account? <span style={{ 
                      color: '#667eea', 
                      cursor: 'pointer',
                      fontWeight: 600,
                      textDecoration: 'underline',
                    }} onClick={() => setMode('signin')}>Sign In</span></>
                  : <>Don't have an account? <span style={{ 
                      color: mode === 'signup' ? '#059669' : '#667eea', 
                      cursor: 'pointer',
                      fontWeight: 600,
                      textDecoration: 'underline',
                    }} onClick={() => setMode('signup')}>Sign Up</span></>
                }
              </div>
            )}
            

          </form>
        </div>
      </div>
      
      {/* Modern CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-20px) rotate(3deg);
          }
          50% {
            transform: translateY(-35px) rotate(0deg);
          }
          75% {
            transform: translateY(-20px) rotate(-3deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes meshMove {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(-10px, -10px) scale(1.05);
          }
          50% {
            transform: translate(10px, -5px) scale(1.02);
          }
          75% {
            transform: translate(-5px, 10px) scale(1.03);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        /* Enhanced Mobile First Responsive Design */
        @media (max-width: 480px) {
          .auth-form {
            margin: 0;
            padding: 16px !important;
            border-radius: 10px !important;
          }
          
          .auth-input {
            font-size: 16px !important; /* Prevents zoom on iOS */
            min-height: 48px !important;
          }
          
          .auth-button {
            min-height: 48px !important;
            font-size: 16px !important;
          }
          
          .auth-toggle button {
            min-height: 44px !important;
            font-size: 14px !important;
          }
        }
        
        @media (max-width: 768px) {
          .auth-form {
            margin: 0;
          }
        }
        
        @media (max-width: 1024px) {
          .auth-form {
            margin: 0;
          }
        }
        
        /* Prevent horizontal scroll on mobile */
        @media (max-width: 480px) {
          body {
            overflow-x: hidden;
          }
          
          * {
            -webkit-tap-highlight-color: transparent;
          }
        }
        
        /* Ensure proper touch targets on mobile */
        @media (max-width: 768px) {
          button, input, .auth-toggle button {
            min-height: 44px;
          }
        }
        
        /* Improve mobile scrolling */
        @media (max-width: 480px) {
          html, body {
            -webkit-overflow-scrolling: touch;
          }
        }
        @media (max-width: 480px) {
          .auth-form {
            min-width: 280px !important;
            margin: 5px !important;
            padding: 20px !important;
          }
          
          .auth-title {
            font-size: 1.3rem !important;
          }
          
          .auth-input {
            font-size: 16px !important;
            padding: 12px !important;
          }
          
          .auth-button {
            padding: 12px !important;
            font-size: 16px !important;
          }
          
          /* Extra small screen optimizations */
          .main-container {
            padding: 5px !important;
            gap: 15px !important;
          }
          
          .content-section {
            padding: 10px !important;
          }
        }
        
        @media (max-width: 768px) {
          .auth-form {
            min-width: 320px !important;
            padding: 24px !important;
            margin: 15px !important;
          }
          
          .auth-title {
            font-size: 1.5rem !important;
          }
          
          .auth-input {
            font-size: 16px !important;
            padding: 14px !important;
          }
          
          .auth-button {
            padding: 14px !important;
            font-size: 16px !important;
          }
          
          /* Stack content vertically on mobile */
          .main-container {
            flex-direction: column !important;
            gap: 20px !important;
          }
          
          /* Center align content on mobile */
          .content-section {
            text-align: center !important;
            order: 2 !important;
          }
          
          .form-section {
            order: 1 !important;
          }
        }
        
        @media (max-width: 1024px) {
          /* Tablet adjustments */
          .main-container {
            gap: 30px !important;
          }
          
          .content-section {
            max-width: 100% !important;
          }
        }
        
        @media (min-width: 1200px) {
          /* Large desktop optimizations */
          .main-container {
            max-width: 1400px !important;
          }
        }
        
        /* Touch-friendly interactions for mobile */
        @media (hover: none) and (pointer: coarse) {
          .auth-button:hover {
            transform: none !important;
          }
          
          .feature-item:hover {
            transform: none !important;
          }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .auth-form {
            border: 2px solid #000 !important;
          }
          
          .auth-input {
            border: 2px solid #000 !important;
          }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SignupSignIn;
