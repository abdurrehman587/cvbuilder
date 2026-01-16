import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../Supabase/supabase';
import './OrderNotification.css';

const OrderNotification = ({ isAdmin, isAuthenticated }) => {
  // eslint-disable-next-line no-unused-vars
  const [newOrders, setNewOrders] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationIntervalRef = useRef(null);
  // eslint-disable-next-line no-unused-vars
  const audioRef = useRef(null);
  const lastCheckedTimeRef = useRef(null);
  const isMarkingAsReadRef = useRef(false);

  // Load unread orders from localStorage
  const getUnreadOrders = () => {
    try {
      const stored = localStorage.getItem('unreadOrders');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  };

  // Save unread orders to localStorage
  const saveUnreadOrders = (orders) => {
    try {
      localStorage.setItem('unreadOrders', JSON.stringify(orders));
    } catch (e) {
      console.error('Error saving unread orders:', e);
    }
  };

  // Mark order as read
  // eslint-disable-next-line no-unused-vars
  const markOrderAsRead = (orderId) => {
    const unread = getUnreadOrders();
    const updated = unread.filter(id => id !== orderId);
    saveUnreadOrders(updated);
    setNewOrders(prev => prev.filter(order => order.id !== orderId));
    updateUnreadCount();
  };

  // Mark all orders as read
  const markAllOrdersAsRead = () => {
    // Prevent recursive calls
    if (isMarkingAsReadRef.current) {
      return;
    }
    
    isMarkingAsReadRef.current = true;
    saveUnreadOrders([]);
    setNewOrders([]);
    setUnreadCount(0);
    setIsVisible(false);
    // Update last checked time to now so we don't re-add these orders
    lastCheckedTimeRef.current = new Date().toISOString();
    // Don't dispatch event here to avoid infinite loop with handleOrdersViewed
    // The state update is sufficient
    
    // Reset flag after a short delay
    setTimeout(() => {
      isMarkingAsReadRef.current = false;
    }, 100);
  };

  // Update unread count
  const updateUnreadCount = () => {
    const unread = getUnreadOrders();
    const count = unread.length;
    setUnreadCount(count);
    setIsVisible(count > 0);
    
    // If no unread orders, clear the newOrders state
    if (count === 0) {
      setNewOrders([]);
      setIsVisible(false);
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Higher pitch
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Could not play notification sound:', e);
    }
  };

  // Show browser notification (if permission granted)
  const showBrowserNotification = (order) => {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification('New Order Received! 🎉', {
        body: `Order #${order.order_number || order.id.slice(0, 8)} from ${order.customer_name || 'Customer'}\nTotal: Rs. ${order.total_amount?.toLocaleString() || '0'}`,
        icon: '/images/glory-logo.png',
        badge: '/images/glory-logo.png',
        tag: `order-${order.id}`,
        requireInteraction: true, // Keep notification until user interacts
        silent: false
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          showBrowserNotification(order);
        }
      });
    }
  };

  // Check for new orders
  const checkForNewOrders = async () => {
    if (!isAdmin || !isAuthenticated) return;

    try {
      // Get the last checked time - if not set, use current time minus 1 minute (only check very recent orders)
      const lastChecked = lastCheckedTimeRef.current || new Date(Date.now() - 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('marketplace_orders')
        .select('*')
        .gt('created_at', lastChecked)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const unread = getUnreadOrders();
        // Only add orders that are not already in the unread list
        const newOrderIds = data
          .filter(order => !unread.includes(order.id))
          .map(order => order.id);

        if (newOrderIds.length > 0) {
          // Add new orders to unread list
          const updatedUnread = [...unread, ...newOrderIds];
          saveUnreadOrders(updatedUnread);

          // Update state
          setNewOrders(prev => {
            // eslint-disable-next-line no-unused-vars
            const existingIds = prev.map(o => o.id);
            const newOrders = data.filter(o => newOrderIds.includes(o.id));
            return [...prev, ...newOrders];
          });

          // Play sound and show browser notification for each new order
          data.forEach(order => {
            if (newOrderIds.includes(order.id)) {
              playNotificationSound();
              showBrowserNotification(order);
            }
          });

          updateUnreadCount();
        }
      }

      // Update last checked time to now (only if we actually checked)
      lastCheckedTimeRef.current = new Date().toISOString();
    } catch (err) {
      console.error('Error checking for new orders:', err);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    if (!isAdmin || !isAuthenticated) {
      // Clear notification if user is not admin
      setIsVisible(false);
      return;
    }

    // Initial check
    checkForNewOrders();
    updateUnreadCount();
    
    // Load existing unread orders from newOrders state
    const unread = getUnreadOrders();
    if (unread.length > 0) {
      // Fetch order details for unread orders
      const fetchUnreadOrderDetails = async () => {
        try {
          const { data, error } = await supabase
            .from('marketplace_orders')
            .select('*')
            .in('id', unread)
            .order('created_at', { ascending: false });

          if (!error && data) {
            setNewOrders(data);
            setIsVisible(true);
          }
        } catch (err) {
          console.error('Error fetching unread order details:', err);
        }
      };
      
      fetchUnreadOrderDetails();
    }

    // Set up realtime subscription
    const channel = supabase
      .channel('new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_orders'
        },
        (payload) => {
          console.log('New order received:', payload.new);
          const newOrder = payload.new;
          
          const unread = getUnreadOrders();
          // Only add if not already in unread list AND not already marked as read
          if (!unread.includes(newOrder.id)) {
            // Add to unread
            const updatedUnread = [...unread, newOrder.id];
            saveUnreadOrders(updatedUnread);

            // Update state
            setNewOrders(prev => {
              // Check if order already exists in state
              if (prev.some(o => o.id === newOrder.id)) {
                return prev;
              }
              return [...prev, newOrder];
            });

            // Play sound and show notification
            playNotificationSound();
            showBrowserNotification(newOrder);

            updateUnreadCount();
            
            // Update last checked time to prevent re-adding
            lastCheckedTimeRef.current = new Date().toISOString();
          }
        }
      )
      .subscribe();

    // Periodic check as backup (every 30 seconds)
    notificationIntervalRef.current = setInterval(() => {
      checkForNewOrders();
    }, 30000);

    // Periodic reminder (every 2 minutes if there are unread orders)
    const reminderInterval = setInterval(() => {
      const unread = getUnreadOrders();
      if (unread.length > 0) {
        playNotificationSound();
        // Flash the notification
        setIsVisible(false);
        setTimeout(() => setIsVisible(true), 100);
      }
    }, 120000); // 2 minutes

    return () => {
      supabase.removeChannel(channel);
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
      }
      clearInterval(reminderInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, isAuthenticated]); // Functions are stable, no need to include them

  // Listen for orders viewed event
  useEffect(() => {
    const handleOrdersViewed = (event) => {
      // Prevent recursive calls
      if (isMarkingAsReadRef.current) {
        return;
      }
      
      // If specific order IDs are provided, only mark those as read
      if (event.detail && event.detail.orderIds && Array.isArray(event.detail.orderIds) && event.detail.orderIds.length > 0) {
        const unread = getUnreadOrders();
        const updatedUnread = unread.filter(id => !event.detail.orderIds.includes(id));
        saveUnreadOrders(updatedUnread);
        setNewOrders(prev => prev.filter(order => !event.detail.orderIds.includes(order.id)));
        updateUnreadCount();
      } else {
        // If no order IDs provided, don't do anything to avoid loops
        // The MarketplaceAdmin will handle marking orders as read when they're loaded
        // Just update the count
        updateUnreadCount();
      }
    };

    // Also check if we're on the admin orders page
    const checkAdminOrdersPage = () => {
      const hash = window.location.hash;
      // Check for both old and new routing formats
      if ((hash.includes('#admin') && hash.includes('tab=orders')) || 
          (hash.includes('#admin/marketplace') && hash.includes('tab=orders'))) {
        // Don't call markAllOrdersAsRead directly - let MarketplaceAdmin handle it
        // through the ordersViewed event system to avoid infinite loops
        // Just update the count to reflect current state
        updateUnreadCount();
      }
    };

    window.addEventListener('ordersViewed', handleOrdersViewed);
    
    // Check on mount and hash changes
    checkAdminOrdersPage();
    window.addEventListener('hashchange', checkAdminOrdersPage);
    
    // Periodic check to update unread count (every 5 seconds)
    const countUpdateInterval = setInterval(() => {
      updateUnreadCount();
    }, 5000);
    
    return () => {
      window.removeEventListener('ordersViewed', handleOrdersViewed);
      window.removeEventListener('hashchange', checkAdminOrdersPage);
      clearInterval(countUpdateInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // updateUnreadCount is stable, no need to include it

  // Handle notification click
  const handleNotificationClick = () => {
    // Navigate to admin panel orders tab (use new routing format)
    window.location.hash = '#admin/marketplace?tab=orders';
  };

  // Request notification permission on mount
  useEffect(() => {
    if (isAdmin && isAuthenticated && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isAdmin, isAuthenticated]);

  // Don't show if no unread orders or not admin
  if (!isAdmin || !isAuthenticated || unreadCount === 0) {
    return null;
  }

  return (
    <>
      <div 
        className={`order-notification ${isVisible ? 'visible' : ''} ${unreadCount > 0 ? 'has-orders' : ''}`}
        onClick={handleNotificationClick}
      >
        <div className="notification-bell">
          🔔
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount}</span>
          )}
        </div>
        <div className="notification-content">
          <div className="notification-title">New Order{unreadCount > 1 ? 's' : ''}!</div>
          <div className="notification-message">
            {unreadCount} unread order{unreadCount > 1 ? 's' : ''} waiting
          </div>
        </div>
        <button 
          className="notification-close"
          onClick={(e) => {
            e.stopPropagation();
            // Option 1: Just dismiss temporarily (reappear after 10 seconds if still unread)
            setIsVisible(false);
            setTimeout(() => {
              const unread = getUnreadOrders();
              if (unread.length > 0) {
                setIsVisible(true);
              }
            }, 10000);
          }}
          title="Dismiss (will reappear if orders still unread)"
        >
          ×
        </button>
        <button
          className="notification-mark-read"
          onClick={(e) => {
            e.stopPropagation();
            markAllOrdersAsRead();
            updateUnreadCount();
          }}
          title="Mark all orders as read"
        >
          ✓
        </button>
      </div>
    </>
  );
};

export default OrderNotification;

