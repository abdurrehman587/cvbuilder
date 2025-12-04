import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../Supabase/supabase';
import './OrderNotification.css';

const OrderNotification = ({ isAdmin, isAuthenticated }) => {
  const [newOrders, setNewOrders] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationIntervalRef = useRef(null);
  const audioRef = useRef(null);
  const lastCheckedTimeRef = useRef(null);

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
  const markOrderAsRead = (orderId) => {
    const unread = getUnreadOrders();
    const updated = unread.filter(id => id !== orderId);
    saveUnreadOrders(updated);
    setNewOrders(prev => prev.filter(order => order.id !== orderId));
    updateUnreadCount();
  };

  // Mark all orders as read
  const markAllOrdersAsRead = () => {
    saveUnreadOrders([]);
    setNewOrders([]);
    setUnreadCount(0);
    setIsVisible(false);
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
      // Get the last checked time
      const lastChecked = lastCheckedTimeRef.current || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('marketplace_orders')
        .select('*')
        .gt('created_at', lastChecked)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const unread = getUnreadOrders();
        const newOrderIds = data
          .filter(order => !unread.includes(order.id))
          .map(order => order.id);

        if (newOrderIds.length > 0) {
          // Add new orders to unread list
          const updatedUnread = [...unread, ...newOrderIds];
          saveUnreadOrders(updatedUnread);

          // Update state
          setNewOrders(prev => {
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

      // Update last checked time
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
          if (!unread.includes(newOrder.id)) {
            // Add to unread
            const updatedUnread = [...unread, newOrder.id];
            saveUnreadOrders(updatedUnread);

            // Update state
            setNewOrders(prev => [...prev, newOrder]);

            // Play sound and show notification
            playNotificationSound();
            showBrowserNotification(newOrder);

            updateUnreadCount();
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
  }, [isAdmin, isAuthenticated]);

  // Listen for orders viewed event
  useEffect(() => {
    const handleOrdersViewed = () => {
      // Clear all unread orders when admin views orders tab
      markAllOrdersAsRead();
    };

    // Also check if we're on the admin orders page
    const checkAdminOrdersPage = () => {
      const hash = window.location.hash;
      if (hash.includes('#admin') && hash.includes('tab=orders')) {
        // Small delay to ensure orders are loaded
        setTimeout(() => {
          markAllOrdersAsRead();
        }, 1000);
      }
    };

    window.addEventListener('ordersViewed', handleOrdersViewed);
    
    // Check on mount and hash changes
    checkAdminOrdersPage();
    window.addEventListener('hashchange', checkAdminOrdersPage);
    
    return () => {
      window.removeEventListener('ordersViewed', handleOrdersViewed);
      window.removeEventListener('hashchange', checkAdminOrdersPage);
    };
  }, []);

  // Handle notification click
  const handleNotificationClick = () => {
    // Navigate to admin panel orders tab
    window.location.href = '/#admin?tab=orders';
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
            if (window.confirm('Mark all orders as read? The notification will disappear.')) {
              markAllOrdersAsRead();
            }
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

