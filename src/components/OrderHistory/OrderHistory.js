import React, { useState, useEffect } from 'react';
import { orderService } from '../../utils/orders';
import { addToCart } from '../../utils/cart';
import { supabase } from '../Supabase/supabase';
import './OrderHistory.css';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reordering, setReordering] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getUserOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load order history. Please try again.');
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
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'delivered' || statusLower === 'paid') {
      return 'status-success';
    } else if (statusLower === 'cancelled') {
      return 'status-cancelled';
    } else if (statusLower === 'processing' || statusLower === 'shipped') {
      return 'status-processing';
    }
    return 'status-pending';
  };

  const handleReorder = async (order) => {
    if (!order.order_items || !Array.isArray(order.order_items)) {
      alert('Unable to reorder: Order items not found.');
      return;
    }

    if (window.confirm('This will add all items from this order to your cart. Continue?')) {
      try {
        setReordering(order.id);
        
        // Clear current cart first (optional - you can remove this if you want to keep existing items)
        // clearCart();
        
        // Fetch product details for each item to ensure we have all necessary data
        const itemsToAdd = [];
        for (const item of order.order_items) {
          try {
            // Try to fetch the product to get current details
            const { data: product, error: productError } = await supabase
              .from('marketplace_products')
              .select('*')
              .eq('id', item.id)
              .single();

            if (product && !productError) {
              // Product still exists, add it with the original quantity
              itemsToAdd.push({
                product,
                quantity: item.quantity || 1
              });
            } else {
              // Product might not exist anymore, but we'll still try to add it
              itemsToAdd.push({
                product: item, // Use the item data from order
                quantity: item.quantity || 1
              });
            }
          } catch (err) {
            console.error('Error fetching product:', err);
            // Still add the item with order data
            itemsToAdd.push({
              product: item,
              quantity: item.quantity || 1
            });
          }
        }

        // Add all items to cart
        let addedCount = 0;
        for (const { product, quantity } of itemsToAdd) {
          // Add the product multiple times based on quantity
          for (let i = 0; i < quantity; i++) {
            addToCart(product);
            addedCount++;
          }
        }

        // Show success message and navigate to cart
        alert(`Added ${addedCount} item(s) to your cart!`);
        window.location.href = '/cart';
      } catch (err) {
        console.error('Error reordering:', err);
        alert('Error adding items to cart. Please try again.');
      } finally {
        setReordering(null);
      }
    }
  };

  const handleViewOrder = (orderId) => {
    window.location.href = `/order/${orderId}`;
  };

  if (loading) {
    return (
      <div className="order-history-page">
        <div className="order-history-container">
          <div className="order-history-loading">
            <p>Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-history-page">
        <div className="order-history-container">
          <div className="order-history-error">
            <p>{error}</p>
            <button onClick={loadOrders} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <div className="order-history-container">
        <div className="order-history-header">
          <button 
            className="order-history-back-button"
            onClick={() => window.location.href = '/marketplace'}
          >
            ← Back to Products
          </button>
          <h1>My Orders</h1>
          <p className="order-history-subtitle">View and reorder your past purchases</p>
        </div>

        {orders.length === 0 ? (
          <div className="order-history-empty">
            <div className="empty-icon">📦</div>
            <h2>No Orders Yet</h2>
            <p>You haven't placed any orders yet. Start shopping to see your order history here!</p>
            <button 
              className="shop-now-button"
              onClick={() => window.location.href = '/marketplace'}
            >
              Shop Now
            </button>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
              const totalItems = orderItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

              return (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div className="order-info">
                      <h3>Order #{order.order_number || order.id.slice(0, 8)}</h3>
                      <p className="order-date">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="order-status-badges">
                      <span className={`status-badge ${getStatusBadgeClass(order.order_status)}`}>
                        {order.order_status || 'Pending'}
                      </span>
                      <span className={`status-badge ${getStatusBadgeClass(order.payment_status)}`}>
                        {order.payment_status || 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="order-card-body">
                    <div className="order-summary">
                      <div className="order-summary-item">
                        <span className="summary-label">Items:</span>
                        <span className="summary-value">{totalItems} item(s)</span>
                      </div>
                      <div className="order-summary-item">
                        <span className="summary-label">Total:</span>
                        <span className="summary-value total-amount">
                          Rs. {order.total_amount?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="order-summary-item">
                        <span className="summary-label">Payment:</span>
                        <span className="summary-value">{order.payment_method || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="order-items-preview">
                      <h4>Items:</h4>
                      <div className="items-list">
                        {orderItems.slice(0, 3).map((item, index) => (
                          <div key={index} className="order-item-preview">
                            <span className="item-name">{item.name || 'Unknown Product'}</span>
                            <span className="item-quantity">Qty: {item.quantity || 1}</span>
                          </div>
                        ))}
                        {orderItems.length > 3 && (
                          <div className="more-items">
                            +{orderItems.length - 3} more item(s)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="order-card-actions">
                    <button
                      className="view-order-button"
                      onClick={() => handleViewOrder(order.id)}
                    >
                      View Details
                    </button>
                    <button
                      className="reorder-button"
                      onClick={() => handleReorder(order)}
                      disabled={reordering === order.id}
                    >
                      {reordering === order.id ? 'Adding to Cart...' : 'Reorder'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;

