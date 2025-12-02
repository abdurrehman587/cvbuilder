import React, { useState, useEffect } from 'react';
import { orderService } from '../../utils/orders';
import './OrderDetails.css';

const OrderDetails = ({ orderId: propOrderId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get orderId from URL hash or prop
  const getOrderIdFromUrl = () => {
    if (propOrderId) return propOrderId;
    
    const hash = window.location.hash;
    // Handle format: #order-details?orderId=01
    const urlParams = new URLSearchParams(hash.split('?')[1] || '');
    const orderId = urlParams.get('orderId');
    if (orderId) return orderId;
    
    // Handle format: #order-details=01
    const match = hash.match(/order-details[=:](.+)/);
    if (match) return match[1];
    
    return null;
  };

  // Check if accessed from admin panel
  const isFromAdmin = () => {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(hash.split('?')[1] || '');
    return urlParams.get('from') === 'admin';
  };
  
  const [orderId] = useState(() => getOrderIdFromUrl());
  const [fromAdmin] = useState(() => isFromAdmin());

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) {
      setError('Order ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Try to get order by order_number first, then by id
      let orderData;
      try {
        // Try getting by order_number (sequential ID like "01")
        const { data: orders } = await orderService.getAllOrders();
        orderData = orders?.find(o => o.order_number === orderId || o.id === orderId);
        
        if (!orderData) {
          // Try getting by UUID id
          orderData = await orderService.getOrder(orderId);
        }
      } catch (err) {
        // If getAllOrders fails (not admin), try getOrder
        orderData = await orderService.getOrder(orderId);
      }
      
      if (!orderData) {
        throw new Error('Order not found');
      }
      
      setOrder(orderData);
    } catch (err) {
      console.error('Error loading order:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'delivered' || statusLower === 'paid') return 'status-success';
    if (statusLower === 'cancelled') return 'status-error';
    if (statusLower === 'processing' || statusLower === 'shipped') return 'status-warning';
    return 'status-pending';
  };

  if (loading) {
    return (
      <div className="order-details-page">
        <div className="order-details-container">
          <div className="order-details-loading">
            <div className="loading-spinner">⏳</div>
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-page">
        <div className="order-details-container">
          <div className="order-details-error">
            <div className="error-icon">❌</div>
            <h2>Order Not Found</h2>
            <p>{error || 'The order you are looking for does not exist.'}</p>
            <button 
              className="btn-primary"
              onClick={() => window.location.href = fromAdmin ? '/#admin?tab=orders' : '/#products'}
            >
              {fromAdmin ? 'Back to Orders' : 'Back to Products'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      <div className="order-details-container">
        <div className="order-details-header">
          <button 
            className="order-details-back-button"
            onClick={() => window.location.href = fromAdmin ? '/#admin?tab=orders' : '/#products'}
          >
            ← {fromAdmin ? 'Back to Orders' : 'Back to Products'}
          </button>
          <h1>Order Details</h1>
        </div>

        <div className="order-details-content">
          {/* Order Header */}
          <div className="order-details-section">
            <div className="order-header-info">
              <div>
                <h2>Order #{order.order_number || order.id.slice(0, 8)}</h2>
                <p className="order-date">Placed on {formatDate(order.created_at)}</p>
              </div>
              <div className="order-status-badges">
                <span className={`status-badge ${getStatusBadgeClass(order.order_status)}`}>
                  {order.order_status || 'Pending'}
                </span>
                <span className={`status-badge ${getStatusBadgeClass(order.payment_status)}`}>
                  Payment: {order.payment_status || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="order-details-section">
            <h3>Order Items</h3>
            <div className="order-items-list">
              {order.order_items && Array.isArray(order.order_items) && order.order_items.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="order-item-image">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} />
                    ) : (
                      <div className="order-item-placeholder">📦</div>
                    )}
                  </div>
                  <div className="order-item-details">
                    <h4>{item.name}</h4>
                    <div className="order-item-price-info">
                      {item.original_price && item.original_price > item.price ? (
                        <>
                          <span className="order-item-price-discounted">Rs. {item.price?.toLocaleString() || '0'}</span>
                          <span className="order-item-price-original">Rs. {item.original_price?.toLocaleString() || '0'}</span>
                        </>
                      ) : (
                        <span className="order-item-price-regular">Rs. {item.price?.toLocaleString() || '0'}</span>
                      )}
                    </div>
                  </div>
                  <div className="order-item-quantity">
                    <span>Qty: {item.quantity || 1}</span>
                    <span className="order-item-total">
                      Rs. {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Information */}
          <div className="order-details-section">
            <h3>Customer Information</h3>
            <div className="order-info-grid">
              <div className="order-info-item">
                <label>Name</label>
                <p>{order.customer_name || 'N/A'}</p>
              </div>
              <div className="order-info-item">
                <label>Email</label>
                <p>{order.customer_email || order.user_email || 'N/A'}</p>
              </div>
              <div className="order-info-item">
                <label>Phone</label>
                <p>{order.customer_phone || 'N/A'}</p>
              </div>
              <div className="order-info-item full-width">
                <label>Delivery Address</label>
                <p>{order.customer_address || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="order-details-section">
            <h3>Payment Information</h3>
            <div className="order-info-grid">
              <div className="order-info-item">
                <label>Payment Method</label>
                <p>
                  {order.payment_method === 'bank_transfer' ? '🏦 Bank Transfer' : 
                   order.payment_method === 'cash_on_delivery' ? '💵 Cash on Delivery' : 
                   order.payment_method || 'N/A'}
                </p>
              </div>
              <div className="order-info-item">
                <label>Payment Status</label>
                <span className={`status-badge ${getStatusBadgeClass(order.payment_status)}`}>
                  {order.payment_status || 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="order-details-section order-summary">
            <h3>Order Summary</h3>
            <div className="order-summary-content">
              <div className="order-summary-row">
                <span>Subtotal</span>
                <span>Rs. {order.total_amount?.toLocaleString() || '0'}</span>
              </div>
              <div className="order-summary-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="order-summary-total">
                <span>Total</span>
                <span>Rs. {order.total_amount?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="order-details-section">
              <h3>Additional Notes</h3>
              <p className="order-notes">{order.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="order-details-actions">
            <button 
              className="btn-primary"
              onClick={() => window.location.href = fromAdmin ? '/#admin?tab=orders' : '/#products'}
            >
              {fromAdmin ? 'Back to Orders' : 'Continue Shopping'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

