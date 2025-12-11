// Order service for managing marketplace orders
import { supabase } from '../components/Supabase/supabase';

const ORDERS_TABLE = 'marketplace_orders';

export const orderService = {
  // Create a new order
  async createOrder(orderData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const order = {
        user_id: user?.id || null,
        user_email: user?.email || orderData.customer_email || null,
        order_items: orderData.order_items,
        total_amount: orderData.total_amount,
        payment_method: orderData.payment_method,
        payment_status: 'pending',
        order_status: 'pending',
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        has_whatsapp: orderData.has_whatsapp || false,
        customer_address: orderData.customer_address,
        notes: orderData.notes || null
      };

      const { data, error } = await supabase
        .from(ORDERS_TABLE)
        .insert([order])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Get orders for current user
  async getUserOrders() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from(ORDERS_TABLE)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }
  },

  // Get a specific order by ID or order_number
  async getOrder(orderId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Try to get by order_number first (sequential ID like "01")
      let query = supabase
        .from(ORDERS_TABLE)
        .select('*')
        .eq('order_number', orderId);

      let { data, error } = await query.maybeSingle();

      // If not found by order_number, try by UUID id
      if (error || !data) {
        query = supabase
          .from(ORDERS_TABLE)
          .select('*')
          .eq('id', orderId);

        const result = await query.single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting order:', error);
      throw error;
    }
  },

  // Get all orders (admin only)
  async getAllOrders() {
    try {
      const { data, error } = await supabase
        .from(ORDERS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all orders:', error);
      throw error;
    }
  },

  // Update order status (admin only)
  async updateOrderStatus(orderId, orderStatus, paymentStatus = null) {
    try {
      const updateData = { order_status: orderStatus };
      if (paymentStatus) {
        updateData.payment_status = paymentStatus;
      }

      const { data, error } = await supabase
        .from(ORDERS_TABLE)
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Generate WhatsApp message for order
  generateWhatsAppMessage(order, messageType = 'order_confirmation') {
    const orderNumber = order.order_number || order.id?.slice(0, 8);
    const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
    const itemsList = orderItems.map(item => 
      `• ${item.name} x${item.quantity} - Rs. ${(item.price * item.quantity).toLocaleString()}`
    ).join('\n');

    const messages = {
      order_confirmation: `🎉 *Order Confirmed!*

Hello ${order.customer_name}!

Thank you for your order from Glory Marketplace.

📦 *Order #${orderNumber}*

*Items:*
${itemsList}

💰 *Total:* Rs. ${order.total_amount?.toLocaleString()}

📍 *Delivery Address:*
${order.customer_address}

💳 *Payment Method:* ${order.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Cash on Delivery'}

${order.payment_method === 'bank_transfer' ? `🏦 *Bank Details:*
Bank: Meezan Bank
Account: Abdur Rehman
A/C No: 02180100520304
IBAN: PK72MEZN000218010050304

Please send payment proof after transfer.` : 'Please keep the exact amount ready at delivery.'}

We'll keep you updated on your order status. Thank you! 🙏`,

      order_shipped: `📦 *Order Shipped!*

Hello ${order.customer_name}!

Great news! Your order #${orderNumber} has been shipped.

*Items:*
${itemsList}

📍 *Delivery Address:*
${order.customer_address}

Your order is on its way! 🚚`,

      order_delivered: `✅ *Order Delivered!*

Hello ${order.customer_name}!

Your order #${orderNumber} has been delivered successfully.

Thank you for shopping with Glory Marketplace! 🎉

We hope you enjoy your purchase. Please feel free to reach out if you have any questions.`,

      order_status: `📋 *Order Status Update*

Hello ${order.customer_name}!

Your order #${orderNumber} status:

📦 *Order Status:* ${order.order_status?.charAt(0).toUpperCase() + order.order_status?.slice(1) || 'Pending'}
💳 *Payment Status:* ${order.payment_status?.charAt(0).toUpperCase() + order.payment_status?.slice(1) || 'Pending'}

*Items:*
${itemsList}

💰 *Total:* Rs. ${order.total_amount?.toLocaleString()}

Thank you for your patience! 🙏`,

      payment_confirmed: `✅ *Payment Confirmed!*

Hello ${order.customer_name}!

Great news! We have received your payment for order #${orderNumber}.

💰 *Amount:* Rs. ${order.total_amount?.toLocaleString()}

*Items:*
${itemsList}

Your order is now being processed and will be shipped soon. We'll notify you once it's on its way!

Thank you for shopping with Glory Marketplace! 🎉`
    };

    return messages[messageType] || messages.order_status;
  },

  // Open WhatsApp with pre-filled message
  sendWhatsAppMessage(order, messageType = 'order_confirmation') {
    if (!order.customer_phone) {
      alert('No phone number available for this order.');
      return;
    }

    // Clean phone number - remove spaces, dashes, etc.
    let phone = order.customer_phone.replace(/[\s\-\(\)]/g, '');
    
    // Add Pakistan country code if not present
    if (phone.startsWith('0')) {
      phone = '92' + phone.slice(1);
    } else if (!phone.startsWith('+') && !phone.startsWith('92')) {
      phone = '92' + phone;
    }
    
    // Remove + if present
    phone = phone.replace('+', '');

    const message = this.generateWhatsAppMessage(order, messageType);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  }
};

