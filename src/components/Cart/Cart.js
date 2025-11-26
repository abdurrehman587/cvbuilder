import React, { useState, useEffect } from 'react';
import { getCart, removeFromCart, updateCartQuantity, clearCart, getCartTotal } from '../../utils/cart';
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);

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
            onClick={() => window.location.href = '/#products'}
          >
            ← Back to Products
          </button>
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some products to your cart to get started!</p>
            <button 
              className="cart-empty-button"
              onClick={() => window.location.href = '/#products'}
            >
              Browse Products
            </button>
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
            onClick={() => window.location.href = '/#products'}
          >
            ← Back to Products
          </button>
          <h1 className="cart-title">Shopping Cart</h1>
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
              onClick={() => window.location.href = '/#checkout'}
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

