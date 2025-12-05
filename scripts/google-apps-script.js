// ============================================
// HAPIYO COFFEE - GOOGLE APPS SCRIPT BACKEND
// ============================================
// 
// LANGKAH SETUP:
// 1. Buka Google Sheets yang sudah di-setup dengan setup-sheets.js
// 2. Klik Extensions > Apps Script
// 3. Hapus semua kode, paste seluruh kode ini
// 4. GANTI 'YOUR_SHEET_ID_HERE' dengan Sheet ID kamu
// 5. Klik Deploy > New Deployment
// 6. Pilih Type: Web app
// 7. Execute as: Me
// 8. Who has access: Anyone
// 9. Klik Deploy, copy URL-nya
// 10. Paste URL ke file .env.local sebagai NEXT_PUBLIC_GAS_API_URL
// ============================================

// ============================================
// ⚠️ GANTI SHEET ID INI!
// ============================================
const SHEET_ID = '1u4XCeHDvjlyCz6DHmKYcF4efe2IekuMIGJrmBNK901w'; 
// Contoh: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
// Cara dapat Sheet ID: Lihat URL sheets kamu
// https://docs.google.com/spreadsheets/d/SHEET_ID_DISINI/edit

// ============================================
// KONEKSI KE SHEETS
// ============================================
let ss, ordersSheet, itemsSheet, configSheet, summarySheet;

function initSheets() {
  if (!ss) {
    ss = SpreadsheetApp.openById(SHEET_ID);
    ordersSheet = ss.getSheetByName('Orders');
    itemsSheet = ss.getSheetByName('OrderItems');
    configSheet = ss.getSheetByName('Config');
    summarySheet = ss.getSheetByName('DailySummary');
  }
}

// ============================================
// WEB APP HANDLERS - CORS ENABLED
// ============================================

function doGet(e) {
  initSheets();
  const action = e.parameter.action;
  
  try {
    let result;
    switch(action) {
      case 'getOrders':
        result = getOrders(e.parameter);
        break;
      case 'getOrderById':
        result = getOrderById(e.parameter.orderId);
        break;
      case 'getOrdersByTable':
        result = getOrdersByTable(e.parameter.table);
        break;
      case 'getConfig':
        result = getConfig();
        break;
      case 'getStats':
        result = getStats();
        break;
      case 'health':
        result = { success: true, status: 'ok', timestamp: new Date().toISOString() };
        break;
      default:
        result = { error: 'Invalid action. Available: getOrders, getOrderById, getOrdersByTable, getConfig, getStats, health' };
    }
    return createCorsResponse(result);
  } catch(error) {
    return createCorsResponse({ error: error.toString() }, 500);
  }
}

function doPost(e) {
  initSheets();
  const action = e.parameter.action;
  let data;
  
  try {
    data = JSON.parse(e.postData.contents);
  } catch(err) {
    return createCorsResponse({ error: 'Invalid JSON body' }, 400);
  }
  
  try {
    let result;
    switch(action) {
      case 'createOrder':
        result = createOrder(data);
        break;
      case 'updateOrderStatus':
        result = updateOrderStatus(data);
        break;
      case 'deleteOrder':
        result = deleteOrder(data.orderId);
        break;
      case 'updateConfig':
        result = updateConfig(data);
        break;
      default:
        result = { error: 'Invalid action. Available: createOrder, updateOrderStatus, deleteOrder, updateConfig' };
    }
    return createCorsResponse(result);
  } catch(error) {
    return createCorsResponse({ error: error.toString() }, 500);
  }
}

// Handle CORS preflight
function doOptions(e) {
  return createCorsResponse({});
}

function createCorsResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ============================================
// ORDER OPERATIONS
// ============================================

function generateOrderId() {
  const prefix = getConfigValue('order_prefix') || 'HPY';
  const today = new Date();
  const dateStr = Utilities.formatDate(today, 'Asia/Jakarta', 'yyyyMMdd');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${dateStr}-${random}`;
}

function createOrder(orderData) {
  // Validate required fields
  if (!orderData.table || !orderData.items || orderData.items.length === 0) {
    return { success: false, error: 'Missing required fields: table, items' };
  }
  
  const orderId = generateOrderId();
  const now = new Date().toISOString();
  
  // Calculate totals
  let totalAmount = 0;
  let itemCount = 0;
  
  orderData.items.forEach(item => {
    const subtotal = (item.price || 0) * (item.quantity || 1);
    totalAmount += subtotal;
    itemCount += item.quantity || 1;
  });
  
  // Add order to Orders sheet
  // Columns: Order ID, Table Number, Customer Name, Status, Total Amount, Item Count, Notes, Created At, Updated At, Completed At
  ordersSheet.appendRow([
    orderId,
    orderData.table,
    orderData.customerName || 'Guest',
    'pending',
    totalAmount,
    itemCount,
    orderData.notes || '',
    now,
    now,
    ''
  ]);
  
  // Add items to OrderItems sheet
  // Columns: Item ID, Order ID, Menu ID, Menu Name, Category, Quantity, Unit Price, Subtotal, Notes, Created At
  orderData.items.forEach((item, index) => {
    const itemId = `${orderId}-${index + 1}`;
    const subtotal = (item.price || 0) * (item.quantity || 1);
    
    itemsSheet.appendRow([
      itemId,
      orderId,
      item.id || item.menuId || '',
      item.name || '',
      item.category || '',
      item.quantity || 1,
      item.price || 0,
      subtotal,
      item.notes || '',
      now
    ]);
  });
  
  // Send notification if configured
  sendOrderNotification(orderId, orderData.table, totalAmount);
  
  return {
    success: true,
    orderId: orderId,
    table: orderData.table,
    total: totalAmount,
    itemCount: itemCount,
    status: 'pending',
    createdAt: now
  };
}

function getOrders(params) {
  const data = ordersSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: true, orders: [] };
  }
  
  const headers = data[0];
  let orders = data.slice(1).map(row => ({
    orderId: row[0],
    table: row[1],
    customerName: row[2],
    status: row[3],
    total: row[4],
    itemCount: row[5],
    notes: row[6],
    createdAt: row[7],
    updatedAt: row[8],
    completedAt: row[9]
  })).filter(o => o.orderId); // Filter out empty rows
  
  // Filter by status
  if (params.status && params.status !== 'all') {
    orders = orders.filter(o => o.status === params.status);
  }
  
  // Filter by table
  if (params.table) {
    orders = orders.filter(o => String(o.table) === String(params.table));
  }
  
  // Filter by date (today only)
  if (params.today === 'true') {
    const today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
    orders = orders.filter(o => {
      if (!o.createdAt) return false;
      const orderDate = Utilities.formatDate(new Date(o.createdAt), 'Asia/Jakarta', 'yyyy-MM-dd');
      return orderDate === today;
    });
  }
  
  // Sort by createdAt descending (newest first)
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Limit results
  if (params.limit) {
    orders = orders.slice(0, parseInt(params.limit));
  }
  
  return { success: true, orders: orders, count: orders.length };
}

function getOrderById(orderId) {
  if (!orderId) {
    return { success: false, error: 'orderId is required' };
  }
  
  // Find order
  const orderData = ordersSheet.getDataRange().getValues();
  const orderRow = orderData.find(row => row[0] === orderId);
  
  if (!orderRow) {
    return { success: false, error: 'Order not found' };
  }
  
  // Get order items
  const itemsData = itemsSheet.getDataRange().getValues();
  const items = itemsData.slice(1)
    .filter(row => row[1] === orderId)
    .map(row => ({
      itemId: row[0],
      menuId: row[2],
      name: row[3],
      category: row[4],
      quantity: row[5],
      price: row[6],
      subtotal: row[7],
      notes: row[8]
    }));
  
  const order = {
    orderId: orderRow[0],
    table: orderRow[1],
    customerName: orderRow[2],
    status: orderRow[3],
    total: orderRow[4],
    itemCount: orderRow[5],
    notes: orderRow[6],
    createdAt: orderRow[7],
    updatedAt: orderRow[8],
    completedAt: orderRow[9],
    items: items
  };
  
  return { success: true, order: order };
}

function getOrdersByTable(table) {
  if (!table) {
    return { success: false, error: 'table is required' };
  }
  
  return getOrders({ table: table, today: 'true' });
}

function updateOrderStatus(data) {
  const { orderId, status } = data;
  
  if (!orderId || !status) {
    return { success: false, error: 'orderId and status are required' };
  }
  
  const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return { success: false, error: `Invalid status. Valid: ${validStatuses.join(', ')}` };
  }
  
  const orderData = ordersSheet.getDataRange().getValues();
  let rowIndex = -1;
  
  for (let i = 1; i < orderData.length; i++) {
    if (orderData[i][0] === orderId) {
      rowIndex = i + 1; // Sheet rows are 1-indexed
      break;
    }
  }
  
  if (rowIndex === -1) {
    return { success: false, error: 'Order not found' };
  }
  
  const now = new Date().toISOString();
  
  // Update status (column D = 4)
  ordersSheet.getRange(rowIndex, 4).setValue(status);
  
  // Update updatedAt (column I = 9)
  ordersSheet.getRange(rowIndex, 9).setValue(now);
  
  // If completed or cancelled, set completedAt (column J = 10)
  if (status === 'completed' || status === 'cancelled') {
    ordersSheet.getRange(rowIndex, 10).setValue(now);
  }
  
  return {
    success: true,
    orderId: orderId,
    status: status,
    updatedAt: now
  };
}

function deleteOrder(orderId) {
  if (!orderId) {
    return { success: false, error: 'orderId is required' };
  }
  
  // Find and delete from Orders
  const orderData = ordersSheet.getDataRange().getValues();
  let orderRowIndex = -1;
  
  for (let i = 1; i < orderData.length; i++) {
    if (orderData[i][0] === orderId) {
      orderRowIndex = i + 1;
      break;
    }
  }
  
  if (orderRowIndex === -1) {
    return { success: false, error: 'Order not found' };
  }
  
  // Delete order row
  ordersSheet.deleteRow(orderRowIndex);
  
  // Delete related items
  const itemsData = itemsSheet.getDataRange().getValues();
  const rowsToDelete = [];
  
  for (let i = itemsData.length - 1; i >= 1; i--) {
    if (itemsData[i][1] === orderId) {
      rowsToDelete.push(i + 1);
    }
  }
  
  // Delete from bottom to top to preserve row indices
  rowsToDelete.forEach(rowIndex => {
    itemsSheet.deleteRow(rowIndex);
  });
  
  return { success: true, orderId: orderId, message: 'Order deleted' };
}

// ============================================
// CONFIG OPERATIONS
// ============================================

function getConfig() {
  const data = configSheet.getDataRange().getValues();
  const config = {};
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      config[data[i][0]] = data[i][1];
    }
  }
  
  return { success: true, config: config };
}

function getConfigValue(key) {
  const data = configSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return data[i][1];
    }
  }
  return null;
}

function updateConfig(data) {
  const { key, value } = data;
  
  if (!key) {
    return { success: false, error: 'key is required' };
  }
  
  const configData = configSheet.getDataRange().getValues();
  let found = false;
  
  for (let i = 1; i < configData.length; i++) {
    if (configData[i][0] === key) {
      configSheet.getRange(i + 1, 2).setValue(value);
      configSheet.getRange(i + 1, 4).setValue(new Date().toISOString());
      found = true;
      break;
    }
  }
  
  if (!found) {
    return { success: false, error: 'Config key not found' };
  }
  
  return { success: true, key: key, value: value };
}

// ============================================
// STATISTICS
// ============================================

function getStats() {
  const orderData = ordersSheet.getDataRange().getValues();
  
  if (orderData.length <= 1) {
    return {
      success: true,
      stats: {
        totalOrders: 0,
        pendingOrders: 0,
        preparingOrders: 0,
        readyOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        todayOrders: 0,
        todayRevenue: 0
      }
    };
  }
  
  const today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
  
  let stats = {
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0
  };
  
  for (let i = 1; i < orderData.length; i++) {
    const row = orderData[i];
    if (!row[0]) continue; // Skip empty rows
    
    stats.totalOrders++;
    const status = row[3];
    const total = Number(row[4]) || 0;
    const createdAt = row[7];
    
    // Count by status
    if (status === 'pending') stats.pendingOrders++;
    else if (status === 'preparing') stats.preparingOrders++;
    else if (status === 'ready') stats.readyOrders++;
    else if (status === 'completed') {
      stats.completedOrders++;
      stats.totalRevenue += total;
    }
    else if (status === 'cancelled') stats.cancelledOrders++;
    
    // Today stats
    if (createdAt) {
      const orderDate = Utilities.formatDate(new Date(createdAt), 'Asia/Jakarta', 'yyyy-MM-dd');
      if (orderDate === today) {
        stats.todayOrders++;
        if (status === 'completed') {
          stats.todayRevenue += total;
        }
      }
    }
  }
  
  return { success: true, stats: stats };
}

// ============================================
// NOTIFICATIONS (Optional)
// ============================================

function sendOrderNotification(orderId, table, total) {
  const email = getConfigValue('notification_email');
  
  if (email) {
    try {
      const subject = `🍵 New Order: ${orderId}`;
      const body = `
New order received at Hapiyo Coffee!

Order ID: ${orderId}
Table: ${table}
Total: Rp ${total.toLocaleString('id-ID')}
Time: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}

Check admin panel for details.
      `;
      
      MailApp.sendEmail(email, subject, body);
    } catch(e) {
      Logger.log('Failed to send email notification: ' + e);
    }
  }
}

// ============================================
// TEST FUNCTION
// ============================================

function testCreateOrder() {
  initSheets();
  
  const testOrder = {
    table: '5',
    customerName: 'Test User',
    notes: 'Test order dari Apps Script',
    items: [
      { id: 'coffee_001', name: 'Hapiyo Latte', category: 'coffee', quantity: 2, price: 25000 },
      { id: 'snack_001', name: 'Butter Croissant', category: 'snacks', quantity: 1, price: 20000 }
    ]
  };
  
  const result = createOrder(testOrder);
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function testGetOrders() {
  initSheets();
  const result = getOrders({ today: 'true' });
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

function testGetStats() {
  initSheets();
  const result = getStats();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
