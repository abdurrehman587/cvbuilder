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
  }
};

