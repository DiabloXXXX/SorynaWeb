// Order Service - Client-side API calls for Google Apps Script backend
// Handles order CRUD operations through local API proxy to avoid CORS

// Use local API proxy instead of direct GAS URL
const API_BASE = '/api/orders';
const GAS_URL = process.env.NEXT_PUBLIC_GAS_API_URL || '';

// ============================================
// TYPES
// ============================================

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  subtotal?: number;
}

export interface Order {
  orderId: string;
  table: string | number;
  timestamp: string;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  notes: string;
  customerName: string;
  items?: OrderItem[];
}

export interface CreateOrderData {
  table: string | number;
  items: OrderItem[];
  notes?: string;
  customerName?: string;
}

export interface OrderResponse {
  success: boolean;
  orderId?: string;
  timestamp?: string;
  total?: number;
  error?: string;
}

export interface OrdersListResponse {
  orders?: Order[];
  error?: string;
}

export interface SingleOrderResponse {
  order?: Order;
  error?: string;
}

// ============================================
// ORDER OPERATIONS
// ============================================

/**
 * Create a new order
 */
export async function createOrder(orderData: CreateOrderData): Promise<OrderResponse> {
  try {
    const response = await fetch(`${API_BASE}?action=createOrder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table: orderData.table,
        items: orderData.items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        notes: orderData.notes || '',
        customerName: orderData.customerName || '',
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        orderId: data.orderId,
        timestamp: data.createdAt || new Date().toISOString(),
        total: data.total,
      };
    } else {
      return { success: false, error: data.error || 'Failed to create order' };
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: 'Failed to create order' };
  }
}

/**
 * Alternative method using JSONP for Google Apps Script
 * This allows reading the response from GAS
 */
export async function createOrderWithCallback(orderData: CreateOrderData): Promise<OrderResponse> {
  return new Promise((resolve) => {
    if (!GAS_URL) {
      resolve({ success: false, error: 'Order service not configured' });
      return;
    }

    const callbackName = 'gasCallback_' + Date.now();
    
    // Create script element for JSONP
    const script = document.createElement('script');
    
    // Set up callback
    (window as unknown as Record<string, (data: OrderResponse) => void>)[callbackName] = (data: OrderResponse) => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };

    // Encode order data
    const encodedData = encodeURIComponent(JSON.stringify(orderData));
    script.src = `${GAS_URL}?action=createOrder&data=${encodedData}&callback=${callbackName}`;
    
    script.onerror = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      document.body.removeChild(script);
      resolve({ success: false, error: 'Network error' });
    };

    document.body.appendChild(script);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if ((window as unknown as Record<string, unknown>)[callbackName]) {
        delete (window as unknown as Record<string, unknown>)[callbackName];
        if (script.parentNode) {
          document.body.removeChild(script);
        }
        resolve({ success: false, error: 'Request timeout' });
      }
    }, 10000);
  });
}

/**
 * Get orders by table number
 */
export async function getOrdersByTable(tableNumber: string | number): Promise<OrdersListResponse> {
  try {
    const response = await fetch(
      `${API_BASE}?action=getOrders&table=${tableNumber}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    return response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { error: 'Failed to fetch orders' };
  }
}

/**
 * Check if table has active order (pending, preparing, or ready)
 * Returns the active order if exists, null if table is available
 */
export async function checkTableAvailability(tableNumber: string | number): Promise<{
  available: boolean;
  activeOrder?: Order;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${API_BASE}?action=getOrders&table=${tableNumber}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    const data = await response.json();
    
    if (data.orders && Array.isArray(data.orders)) {
      // Find any order that is NOT completed or cancelled
      const activeOrder = data.orders.find((order: Order) => 
        order.status === 'pending' || 
        order.status === 'preparing' || 
        order.status === 'ready'
      );
      
      if (activeOrder) {
        return { available: false, activeOrder };
      }
    }
    
    return { available: true };
  } catch (error) {
    console.error('Error checking table availability:', error);
    return { available: true, error: 'Could not verify table status' };
  }
}

/**
 * Get all orders (Admin)
 */
export async function getAllOrders(status?: string): Promise<OrdersListResponse> {
  try {
    let url = `${API_BASE}?action=getOrders`;
    if (status) {
      url += `&status=${status}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    return response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { error: 'Failed to fetch orders' };
  }
}

/**
 * Get single order by ID
 */
export async function getOrderById(orderId: string): Promise<SingleOrderResponse> {
  try {
    const response = await fetch(
      `${API_BASE}?action=getOrderById&orderId=${orderId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    
    return response.json();
  } catch (error) {
    console.error('Error fetching order:', error);
    return { error: 'Failed to fetch order' };
  }
}

/**
 * Update order status (Admin)
 */
export async function updateOrderStatus(
  orderId: string, 
  status: Order['status']
): Promise<OrderResponse> {
  try {
    const response = await fetch('/api/orders?action=updateOrderStatus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
    
    return response.json();
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: 'Failed to update order status' };
  }
}

/**
 * Delete order (Admin)
 */
export async function deleteOrder(orderId: string): Promise<OrderResponse> {
  try {
    const response = await fetch('/api/orders?action=deleteOrder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    
    return response.json();
  } catch (error) {
    console.error('Error deleting order:', error);
    return { success: false, error: 'Failed to delete order' };
  }
}

// ============================================
// STATISTICS
// ============================================

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
}

export interface StatsResponse {
  success: boolean;
  stats?: OrderStats;
  error?: string;
}

/**
 * Get order statistics (Admin)
 */
export async function getOrderStats(): Promise<StatsResponse> {
  try {
    const response = await fetch('/api/orders?action=getStats', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    return response.json();
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { success: false, error: 'Failed to fetch stats' };
  }
}

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Check if Google Apps Script API is accessible
 */
export async function checkAPIHealth(): Promise<{ status: string; timestamp?: Date; error?: string }> {
  try {
    const response = await fetch('/api/orders?action=health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    return response.json();
  } catch (error) {
    console.error('Error checking API health:', error);
    return { status: 'error', error: 'API unreachable' };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate order total from items
 */
export function calculateOrderTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

/**
 * Format order timestamp
 */
export function formatOrderTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get time elapsed since order
 */
export function getTimeElapsed(timestamp: string): string {
  const now = new Date();
  const orderTime = new Date(timestamp);
  const diffMs = now.getTime() - orderTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

/**
 * Get status label in Indonesian
 */
export function getStatusLabel(status: Order['status']): string {
  const labels: Record<Order['status'], string> = {
    pending: 'Menunggu',
    preparing: 'Diproses',
    ready: 'Siap',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  };
  return labels[status] || status;
}

/**
 * Get status color class
 */
export function getStatusColor(status: Order['status']): string {
  const colors: Record<Order['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    preparing: 'bg-blue-100 text-blue-700',
    ready: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}
