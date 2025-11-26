import React, { useState, useEffect } from 'react';
import { getCart, getCartTotal, clearCart } from '../../utils/cart';
import { orderService } from '../../utils/orders';
import { authService } from '../Supabase/supabase';
import './Checkout.css';

const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    payment_method: 'bank_transfer', // 'bank_transfer' or 'cash_on_delivery'
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCart();
    loadUser();
  }, []);

  const loadCart = () => {
    const cart = getCart();
    setCartItems(cart);
    setCartTotal(getCartTotal());
  };

  const loadUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setFormData(prev => ({
          ...prev,
          customer_email: user.email || ''
        }));
      }
    } catch (error) {
      // User not logged in, that's okay for guest checkout
      console.log('No user logged in');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Name is required';
    }

    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.customer_phone)) {
      newErrors.customer_phone = 'Please enter a valid phone number';
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customer_email)) {
      newErrors.customer_email = 'Please enter a valid email address';
    }

    if (!formData.customer_address.trim()) {
      newErrors.customer_address = 'Delivery address is required';
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Please select a payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty. Please add items to your cart first.');
      window.location.href = '/#cart';
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        order_items: cartItems,
        total_amount: cartTotal,
        payment_method: formData.payment_method,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email,
        customer_address: formData.customer_address,
        notes: formData.notes || null
      };

      const order = await orderService.createOrder(orderData);
      
      // Clear cart after successful order
      clearCart();
      
      // Use order_number if available, otherwise fall back to id
      setOrderId(order.order_number || order.id);
      setOrderPlaced(true);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again. Error: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="order-confirmation">
            <div className="order-confirmation-icon">✅</div>
            <h1>Order Placed Successfully!</h1>
            <p className="order-confirmation-message">
              Thank you for your order. Your order number is: <strong>#{orderId}</strong>
            </p>
            
            <div className="order-confirmation-details">
              <h2>What's Next?</h2>
              
              {formData.payment_method === 'bank_transfer' ? (
                <div className="payment-instructions">
                  <h3>Bank Transfer Instructions</h3>
                  <p>Please transfer the amount of <strong>Rs. {cartTotal.toLocaleString()}</strong> to:</p>
                  <div className="bank-details">
                    <p><strong>Bank Name:</strong> [Your Bank Name]</p>
                    <p><strong>Account Number:</strong> [Your Account Number]</p>
                    <p><strong>Account Title:</strong> [Account Title]</p>
                    <p><strong>IBAN:</strong> [Your IBAN]</p>
                  </div>
                  <p className="payment-note">
                    After making the transfer, please send a screenshot or proof of payment to our email or WhatsApp.
                    Your order will be processed once payment is confirmed.
                  </p>
                </div>
              ) : (
                <div className="payment-instructions">
                  <h3>Cash on Delivery</h3>
                  <p>Your order will be delivered to:</p>
                  <div className="delivery-address">
                    <p>{formData.customer_address}</p>
                  </div>
                  <p className="payment-note">
                    Please have the exact amount (<strong>Rs. {cartTotal.toLocaleString()}</strong>) ready when the delivery arrives.
                  </p>
                </div>
              )}
            </div>

            <div className="order-confirmation-actions">
              <button 
                className="btn-primary"
                onClick={() => window.location.href = '/#products'}
              >
                Continue Shopping
              </button>
              <button 
                className="btn-secondary"
                onClick={() => window.location.href = `/#order-details?orderId=${orderId}`}
              >
                View Order Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-empty">
            <div className="checkout-empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some products to your cart to proceed with checkout.</p>
            <button 
              className="btn-primary"
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
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <button 
            className="checkout-back-button"
            onClick={() => window.location.href = '/#cart'}
          >
            ← Back to Cart
          </button>
          <h1>Checkout</h1>
        </div>

        <div className="checkout-content">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="checkout-section">
              <h2>Customer Information</h2>
              
              <div className="form-group">
                <label htmlFor="customer_name">Full Name *</label>
                <input
                  type="text"
                  id="customer_name"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleInputChange}
                  className={errors.customer_name ? 'error' : ''}
                  placeholder="Enter your full name"
                />
                {errors.customer_name && (
                  <span className="error-message">{errors.customer_name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="customer_phone">Phone Number *</label>
                <input
                  type="tel"
                  id="customer_phone"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                  className={errors.customer_phone ? 'error' : ''}
                  placeholder="Enter your phone number"
                />
                {errors.customer_phone && (
                  <span className="error-message">{errors.customer_phone}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="customer_email">Email Address *</label>
                <input
                  type="email"
                  id="customer_email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  className={errors.customer_email ? 'error' : ''}
                  placeholder="Enter your email address"
                />
                {errors.customer_email && (
                  <span className="error-message">{errors.customer_email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="customer_address">Delivery Address *</label>
                <textarea
                  id="customer_address"
                  name="customer_address"
                  value={formData.customer_address}
                  onChange={handleInputChange}
                  className={errors.customer_address ? 'error' : ''}
                  placeholder="Enter your complete delivery address"
                  rows="4"
                />
                {errors.customer_address && (
                  <span className="error-message">{errors.customer_address}</span>
                )}
              </div>
            </div>

            <div className="checkout-section">
              <h2>Payment Method</h2>
              
              <div className="payment-methods">
                <label className={`payment-method-option ${formData.payment_method === 'bank_transfer' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="bank_transfer"
                    checked={formData.payment_method === 'bank_transfer'}
                    onChange={handleInputChange}
                  />
                  <div className="payment-method-content">
                    <div className="payment-method-icon">🏦</div>
                    <div className="payment-method-details">
                      <h3>Bank Transfer</h3>
                      <p>Transfer money directly to our bank account</p>
                    </div>
                  </div>
                </label>

                <label className={`payment-method-option ${formData.payment_method === 'cash_on_delivery' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash_on_delivery"
                    checked={formData.payment_method === 'cash_on_delivery'}
                    onChange={handleInputChange}
                  />
                  <div className="payment-method-content">
                    <div className="payment-method-icon">💵</div>
                    <div className="payment-method-details">
                      <h3>Cash on Delivery</h3>
                      <p>Pay when your order arrives</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="checkout-section">
              <h2>Additional Notes (Optional)</h2>
              <div className="form-group">
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any special instructions or notes for your order..."
                  rows="3"
                />
              </div>
            </div>

            <div className="checkout-summary">
              <h2>Order Summary</h2>
              <div className="checkout-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="checkout-item">
                    <div className="checkout-item-info">
                      <span className="checkout-item-name">{item.name}</span>
                      <span className="checkout-item-quantity">x{item.quantity}</span>
                    </div>
                    <span className="checkout-item-price">
                      Rs. {(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="checkout-total">
                <span>Total</span>
                <span>Rs. {cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="checkout-submit-button"
              disabled={loading}
            >
              {loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

