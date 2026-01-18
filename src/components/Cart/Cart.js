import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, removeFromCart, updateCartQuantity, clearCart, getCartTotal } from '../../utils/cart';
import { authService } from '../Supabase/supabase';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await authService.getCurrentUser();
      setIsAuthenticated(!!user);
    } catch (err) {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    loadCart();
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const loadCart = () => {
    const cart = getCart();
    setCartItems(cart);
    setCartTotal(getCartTotal());
  };

  const handleRemoveItem = (productId) => {
    removeFromCart(productId);
    loadCart();
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
    } else {
      updateCartQuantity(productId, newQuantity);
      loadCart();
    }
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
      loadCart();
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <button 
            className="cart-back-button"
            onClick={() => window.location.href = '/marketplace'}
          >
            ← Back to Products
          </button>
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some products to your cart to get started!</p>
            <div className="cart-empty-actions">
              <button 
                className="cart-empty-button"
                onClick={() => window.location.href = '/marketplace'}
              >
                Browse Products
              </button>
              {isAuthenticated && (
                <button 
                  className="cart-empty-button order-history-button"
                  onClick={() => window.location.href = '/#order-history'}
                >
                  📋 View Order History
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <button 
            className="cart-back-button"
            onClick={() => window.location.href = '/marketplace'}
          >
            ← Back to Products
          </button>
          <div className="cart-header-right">
            <h1 className="cart-title">Shopping Cart</h1>
            {isAuthenticated && (
              <button
                className="order-history-link-button"
                onClick={() => window.location.href = '/#order-history'}
                title="View Order History"
              >
                📋 Order History
              </button>
            )}
          </div>
          {cartItems.length > 0 && (
            <button 
              className="cart-clear-button"
              onClick={handleClearCart}
            >
              Clear Cart
            </button>
          )}
        </div>

        <div className="cart-content">
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} />
                  ) : (
                    <div className="cart-item-placeholder">📦</div>
                  )}
                </div>
                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <div className="cart-item-price">
                    {item.original_price && item.original_price > item.price ? (
                      <>
                        <span className="cart-item-price-discounted">Rs. {item.price?.toLocaleString() || '0'}</span>
                        <span className="cart-item-price-original">Rs. {item.original_price?.toLocaleString() || '0'}</span>
                      </>
                    ) : (
                      <span className="cart-item-price-regular">Rs. {item.price?.toLocaleString() || '0'}</span>
                    )}
                  </div>
                </div>
                <div className="cart-item-controls">
                  <div className="cart-item-quantity">
                    <button
                      className="quantity-btn"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="quantity-value">{item.quantity}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-item-total">
                    Rs. {(item.price * item.quantity)?.toLocaleString() || '0'}
                  </div>
                  <button
                    className="cart-item-remove"
                    onClick={() => handleRemoveItem(item.id)}
                    title="Remove item"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-summary-header">
              <h2>Order Summary</h2>
            </div>
            <div className="cart-summary-content">
              <div className="cart-summary-row">
                <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span>Rs. {cartTotal.toLocaleString()}</span>
              </div>
              <div className="cart-summary-total">
                <span>Total</span>
                <span>Rs. {cartTotal.toLocaleString()}</span>
              </div>
            </div>
            <button 
              className="cart-checkout-button"
              onClick={() => {
                // Navigate to checkout using React Router
                // Clear any routing flags that might interfere
                sessionStorage.setItem('isNavigating', 'true');
                sessionStorage.setItem('navigationTimestamp', Date.now().toString());
                // Don't set routingApp - let the route check handle it
                // Navigate to checkout
                navigate('/checkout', { replace: false });
              }}
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

