// Cart utility functions for managing shopping cart

const CART_STORAGE_KEY = 'marketplace_cart';

// Get cart from localStorage
export const getCart = () => {
  try {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch (error) {
    console.error('Error getting cart:', error);
    return [];
  }
};

// Save cart to localStorage
const saveCart = (cart) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  } catch (error) {
    console.error('Error saving cart:', error);
  }
};

// Add product to cart
export const addToCart = (product) => {
  const cart = getCart();
  
  // Check if product already exists in cart
  const existingItemIndex = cart.findIndex(item => item.id === product.id);
  
  if (existingItemIndex >= 0) {
    // If product exists, increase quantity
    cart[existingItemIndex].quantity += 1;
  } else {
    // If product doesn't exist, add it with quantity 1
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      original_price: product.original_price || null,
      image_url: product.image_url || (product.image_urls && product.image_urls[0]) || null,
      quantity: 1
    });
  }
  
  saveCart(cart);
  return cart;
};

// Remove product from cart
export const removeFromCart = (productId) => {
  const cart = getCart();
  const updatedCart = cart.filter(item => item.id !== productId);
  saveCart(updatedCart);
  return updatedCart;
};

// Update product quantity in cart
export const updateCartQuantity = (productId, quantity) => {
  if (quantity <= 0) {
    return removeFromCart(productId);
  }
  
  const cart = getCart();
  const updatedCart = cart.map(item => 
    item.id === productId ? { ...item, quantity } : item
  );
  saveCart(updatedCart);
  return updatedCart;
};

// Clear entire cart
export const clearCart = () => {
  saveCart([]);
};

// Get cart item count
export const getCartItemCount = () => {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
};

// Get cart total
export const getCartTotal = () => {
  const cart = getCart();
  return cart.reduce((total, item) => {
    const itemPrice = item.price || 0;
    return total + (itemPrice * item.quantity);
  }, 0);
};

// Check if product is in cart
export const isInCart = (productId) => {
  const cart = getCart();
  return cart.some(item => item.id === productId);
};

// Get product quantity in cart
export const getProductQuantity = (productId) => {
  const cart = getCart();
  const item = cart.find(item => item.id === productId);
  return item ? item.quantity : 0;
};

