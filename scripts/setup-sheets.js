/**
 * ============================================
 * HAPIYO COFFEE - GOOGLE SHEETS DATABASE SETUP
 * ============================================
 * 
 * CARA PENGGUNAAN:
 * 1. Buat Google Sheets baru
 * 2. Buka Extensions > Apps Script
 * 3. Copy-paste seluruh kode ini
 * 4. Jalankan fungsi setupDatabase() (klik Run)
 * 5. Authorize akses yang diminta
 * 6. Sheets akan otomatis terbuat dengan struktur yang benar
 * 
 * SHEETS YANG AKAN DIBUAT:
 * - Orders: Data pesanan utama
 * - OrderItems: Detail item dalam pesanan
 * - Config: Konfigurasi toko
 * - DailySummary: Ringkasan penjualan harian
 * - MenuSync: Sinkronisasi menu (opsional)
 */

// ============================================
// MAIN SETUP FUNCTION
// ============================================

function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Logger.log('🚀 Memulai setup database Hapiyo Coffee...');
  
  // Setup semua sheets
  setupOrdersSheet(ss);
  setupOrderItemsSheet(ss);
  setupConfigSheet(ss);
  setupDailySummarySheet(ss);
  setupMenuSyncSheet(ss);
  
  // Hapus sheet default jika kosong
  removeEmptyDefaultSheet(ss);
  
  Logger.log('✅ Setup database selesai!');
  Logger.log('📋 Sheet ID: ' + ss.getId());
  Logger.log('🔗 URL: ' + ss.getUrl());
  
  // Tampilkan popup sukses
  SpreadsheetApp.getUi().alert(
    '✅ Setup Selesai!',
    'Database Hapiyo Coffee berhasil dibuat.\n\n' +
    'Sheet ID: ' + ss.getId() + '\n\n' +
    'Selanjutnya:\n' +
    '1. Copy Sheet ID di atas\n' +
    '2. Paste ke google-apps-script.js\n' +
    '3. Deploy sebagai Web App',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ============================================
// ORDERS SHEET
// ============================================

function setupOrdersSheet(ss) {
  let sheet = ss.getSheetByName('Orders');
  
  if (!sheet) {
    sheet = ss.insertSheet('Orders');
    Logger.log('📄 Created Orders sheet');
  } else {
    sheet.clear();
    Logger.log('🔄 Cleared existing Orders sheet');
  }
  
  // Headers
  const headers = [
    'Order ID',
    'Table Number', 
    'Customer Name',
    'Status',
    'Total Amount',
    'Item Count',
    'Notes',
    'Created At',
    'Updated At',
    'Completed At'
  ];
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#1a1a2e');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Set column widths
  sheet.setColumnWidth(1, 180); // Order ID
  sheet.setColumnWidth(2, 100); // Table Number
  sheet.setColumnWidth(3, 150); // Customer Name
  sheet.setColumnWidth(4, 100); // Status
  sheet.setColumnWidth(5, 120); // Total Amount
  sheet.setColumnWidth(6, 100); // Item Count
  sheet.setColumnWidth(7, 200); // Notes
  sheet.setColumnWidth(8, 160); // Created At
  sheet.setColumnWidth(9, 160); // Updated At
  sheet.setColumnWidth(10, 160); // Completed At
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Add data validation for Status column
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['pending', 'preparing', 'ready', 'completed', 'cancelled'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('D2:D1000').setDataValidation(statusRule);
  
  // Format currency column
  sheet.getRange('E2:E1000').setNumberFormat('Rp #,##0');
  
  // Add conditional formatting for status
  addStatusConditionalFormatting(sheet, 'D2:D1000');
  
  Logger.log('✅ Orders sheet configured');
}

// ============================================
// ORDER ITEMS SHEET
// ============================================

function setupOrderItemsSheet(ss) {
  let sheet = ss.getSheetByName('OrderItems');
  
  if (!sheet) {
    sheet = ss.insertSheet('OrderItems');
    Logger.log('📄 Created OrderItems sheet');
  } else {
    sheet.clear();
    Logger.log('🔄 Cleared existing OrderItems sheet');
  }
  
  // Headers
  const headers = [
    'Item ID',
    'Order ID',
    'Menu ID',
    'Menu Name',
    'Category',
    'Quantity',
    'Unit Price',
    'Subtotal',
    'Notes',
    'Created At'
  ];
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#16213e');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Set column widths
  sheet.setColumnWidth(1, 180); // Item ID
  sheet.setColumnWidth(2, 180); // Order ID
  sheet.setColumnWidth(3, 120); // Menu ID
  sheet.setColumnWidth(4, 180); // Menu Name
  sheet.setColumnWidth(5, 100); // Category
  sheet.setColumnWidth(6, 80);  // Quantity
  sheet.setColumnWidth(7, 120); // Unit Price
  sheet.setColumnWidth(8, 120); // Subtotal
  sheet.setColumnWidth(9, 200); // Notes
  sheet.setColumnWidth(10, 160); // Created At
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Format currency columns
  sheet.getRange('G2:H1000').setNumberFormat('Rp #,##0');
  
  Logger.log('✅ OrderItems sheet configured');
}

// ============================================
// CONFIG SHEET
// ============================================

function setupConfigSheet(ss) {
  let sheet = ss.getSheetByName('Config');
  
  if (!sheet) {
    sheet = ss.insertSheet('Config');
    Logger.log('📄 Created Config sheet');
  } else {
    sheet.clear();
    Logger.log('🔄 Cleared existing Config sheet');
  }
  
  // Headers
  const headers = ['Key', 'Value', 'Description', 'Updated At'];
  
  // Initial config data
  const configData = [
    headers,
    ['shop_name', 'Hapiyo Coffee', 'Nama toko', new Date().toISOString()],
    ['shop_address', 'Jl. Example No. 123', 'Alamat toko', new Date().toISOString()],
    ['shop_phone', '08123456789', 'Nomor telepon', new Date().toISOString()],
    ['tax_rate', '0.11', 'Persentase pajak (PPN 11%)', new Date().toISOString()],
    ['service_charge', '0', 'Persentase service charge', new Date().toISOString()],
    ['currency', 'IDR', 'Mata uang', new Date().toISOString()],
    ['timezone', 'Asia/Jakarta', 'Zona waktu', new Date().toISOString()],
    ['order_prefix', 'HPY', 'Prefix untuk Order ID', new Date().toISOString()],
    ['table_count', '20', 'Jumlah meja', new Date().toISOString()],
    ['auto_complete_minutes', '60', 'Auto complete order setelah X menit', new Date().toISOString()],
    ['notification_email', '', 'Email untuk notifikasi order baru', new Date().toISOString()],
    ['whatsapp_number', '', 'Nomor WhatsApp untuk notifikasi', new Date().toISOString()],
    ['opening_hour', '08:00', 'Jam buka', new Date().toISOString()],
    ['closing_hour', '22:00', 'Jam tutup', new Date().toISOString()],
    ['is_open', 'true', 'Status toko buka/tutup', new Date().toISOString()]
  ];
  
  // Set data
  sheet.getRange(1, 1, configData.length, 4).setValues(configData);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, 4);
  headerRange.setBackground('#0f3460');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Set column widths
  sheet.setColumnWidth(1, 180); // Key
  sheet.setColumnWidth(2, 200); // Value
  sheet.setColumnWidth(3, 300); // Description
  sheet.setColumnWidth(4, 180); // Updated At
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Protect key column
  const keyRange = sheet.getRange('A2:A100');
  keyRange.setBackground('#f0f0f0');
  
  Logger.log('✅ Config sheet configured');
}

// ============================================
// DAILY SUMMARY SHEET
// ============================================

function setupDailySummarySheet(ss) {
  let sheet = ss.getSheetByName('DailySummary');
  
  if (!sheet) {
    sheet = ss.insertSheet('DailySummary');
    Logger.log('📄 Created DailySummary sheet');
  } else {
    sheet.clear();
    Logger.log('🔄 Cleared existing DailySummary sheet');
  }
  
  // Headers
  const headers = [
    'Date',
    'Total Orders',
    'Completed Orders',
    'Cancelled Orders',
    'Total Revenue',
    'Average Order Value',
    'Total Items Sold',
    'Top Selling Item',
    'Peak Hour',
    'Notes'
  ];
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#e94560');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Set column widths
  sheet.setColumnWidth(1, 120); // Date
  sheet.setColumnWidth(2, 100); // Total Orders
  sheet.setColumnWidth(3, 130); // Completed Orders
  sheet.setColumnWidth(4, 130); // Cancelled Orders
  sheet.setColumnWidth(5, 140); // Total Revenue
  sheet.setColumnWidth(6, 150); // Average Order Value
  sheet.setColumnWidth(7, 120); // Total Items Sold
  sheet.setColumnWidth(8, 180); // Top Selling Item
  sheet.setColumnWidth(9, 100); // Peak Hour
  sheet.setColumnWidth(10, 200); // Notes
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Format currency columns
  sheet.getRange('E2:F1000').setNumberFormat('Rp #,##0');
  
  // Format date column
  sheet.getRange('A2:A1000').setNumberFormat('dd/mm/yyyy');
  
  Logger.log('✅ DailySummary sheet configured');
}

// ============================================
// MENU SYNC SHEET (Optional backup)
// ============================================

function setupMenuSyncSheet(ss) {
  let sheet = ss.getSheetByName('MenuSync');
  
  if (!sheet) {
    sheet = ss.insertSheet('MenuSync');
    Logger.log('📄 Created MenuSync sheet');
  } else {
    sheet.clear();
    Logger.log('🔄 Cleared existing MenuSync sheet');
  }
  
  // Headers
  const headers = [
    'Menu ID',
    'Name',
    'Category',
    'Price',
    'Description',
    'Image URL',
    'Available',
    'Stock',
    'Last Synced'
  ];
  
  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#533483');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // Set column widths
  sheet.setColumnWidth(1, 120); // Menu ID
  sheet.setColumnWidth(2, 180); // Name
  sheet.setColumnWidth(3, 100); // Category
  sheet.setColumnWidth(4, 100); // Price
  sheet.setColumnWidth(5, 250); // Description
  sheet.setColumnWidth(6, 300); // Image URL
  sheet.setColumnWidth(7, 80);  // Available
  sheet.setColumnWidth(8, 80);  // Stock
  sheet.setColumnWidth(9, 160); // Last Synced
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Format price column
  sheet.getRange('D2:D1000').setNumberFormat('Rp #,##0');
  
  // Add note
  sheet.getRange('A1').setNote('Sheet ini untuk backup/sinkronisasi menu dari Vercel KV. Menu utama disimpan di Redis.');
  
  Logger.log('✅ MenuSync sheet configured');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function addStatusConditionalFormatting(sheet, range) {
  const rules = sheet.getConditionalFormatRules();
  
  // Pending - Yellow
  const pendingRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('pending')
    .setBackground('#fff3cd')
    .setFontColor('#856404')
    .setRanges([sheet.getRange(range)])
    .build();
  
  // Preparing - Blue
  const preparingRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('preparing')
    .setBackground('#cce5ff')
    .setFontColor('#004085')
    .setRanges([sheet.getRange(range)])
    .build();
  
  // Ready - Cyan
  const readyRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('ready')
    .setBackground('#d1ecf1')
    .setFontColor('#0c5460')
    .setRanges([sheet.getRange(range)])
    .build();
  
  // Completed - Green
  const completedRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('completed')
    .setBackground('#d4edda')
    .setFontColor('#155724')
    .setRanges([sheet.getRange(range)])
    .build();
  
  // Cancelled - Red
  const cancelledRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('cancelled')
    .setBackground('#f8d7da')
    .setFontColor('#721c24')
    .setRanges([sheet.getRange(range)])
    .build();
  
  rules.push(pendingRule, preparingRule, readyRule, completedRule, cancelledRule);
  sheet.setConditionalFormatRules(rules);
}

function removeEmptyDefaultSheet(ss) {
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() === 0) {
    ss.deleteSheet(defaultSheet);
    Logger.log('🗑️ Removed empty default Sheet1');
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate Order ID dengan format: HPY-YYYYMMDD-XXXX
 */
function generateOrderId() {
  const config = getConfigValue('order_prefix') || 'HPY';
  const today = new Date();
  const dateStr = Utilities.formatDate(today, 'Asia/Jakarta', 'yyyyMMdd');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${config}-${dateStr}-${random}`;
}

/**
 * Get config value by key
 */
function getConfigValue(key) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('Config');
  
  if (!configSheet) return null;
  
  const data = configSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return data[i][1];
    }
  }
  return null;
}

/**
 * Set config value by key
 */
function setConfigValue(key, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('Config');
  
  if (!configSheet) return false;
  
  const data = configSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      configSheet.getRange(i + 1, 2).setValue(value);
      configSheet.getRange(i + 1, 4).setValue(new Date().toISOString());
      return true;
    }
  }
  return false;
}

/**
 * Generate Daily Summary untuk tanggal tertentu
 */
function generateDailySummary(dateStr) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ordersSheet = ss.getSheetByName('Orders');
  const itemsSheet = ss.getSheetByName('OrderItems');
  const summarySheet = ss.getSheetByName('DailySummary');
  
  if (!ordersSheet || !itemsSheet || !summarySheet) {
    Logger.log('❌ Required sheets not found');
    return;
  }
  
  const targetDate = dateStr || Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
  
  const ordersData = ordersSheet.getDataRange().getValues();
  const itemsData = itemsSheet.getDataRange().getValues();
  
  // Filter orders for target date
  let totalOrders = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;
  let totalRevenue = 0;
  let totalItems = 0;
  const hourCounts = {};
  
  for (let i = 1; i < ordersData.length; i++) {
    const orderDate = ordersData[i][7]; // Created At
    if (!orderDate) continue;
    
    const orderDateStr = Utilities.formatDate(new Date(orderDate), 'Asia/Jakarta', 'yyyy-MM-dd');
    if (orderDateStr !== targetDate) continue;
    
    totalOrders++;
    const status = ordersData[i][3];
    
    if (status === 'completed') {
      completedOrders++;
      totalRevenue += Number(ordersData[i][4]) || 0;
      totalItems += Number(ordersData[i][5]) || 0;
    } else if (status === 'cancelled') {
      cancelledOrders++;
    }
    
    // Track peak hour
    const hour = new Date(orderDate).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }
  
  // Find peak hour
  let peakHour = '-';
  let maxCount = 0;
  for (const hour in hourCounts) {
    if (hourCounts[hour] > maxCount) {
      maxCount = hourCounts[hour];
      peakHour = `${hour}:00`;
    }
  }
  
  // Calculate average
  const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
  
  // Find top selling item (simplified)
  const topItem = 'N/A'; // Could be enhanced to track this
  
  // Add to summary sheet
  const newRow = [
    targetDate,
    totalOrders,
    completedOrders,
    cancelledOrders,
    totalRevenue,
    avgOrderValue,
    totalItems,
    topItem,
    peakHour,
    ''
  ];
  
  summarySheet.appendRow(newRow);
  Logger.log(`✅ Generated summary for ${targetDate}`);
}

/**
 * Menu untuk menjalankan dari Apps Script UI
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🍵 Hapiyo Coffee')
    .addItem('🔧 Setup Database', 'setupDatabase')
    .addSeparator()
    .addItem('📊 Generate Daily Summary', 'generateTodaySummary')
    .addItem('📈 View Statistics', 'showStatistics')
    .addSeparator()
    .addItem('🔗 Get Sheet ID', 'showSheetId')
    .addItem('❓ Help', 'showHelp')
    .addToUi();
}

function generateTodaySummary() {
  generateDailySummary();
  SpreadsheetApp.getUi().alert('✅ Daily summary generated!');
}

function showStatistics() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ordersSheet = ss.getSheetByName('Orders');
  
  if (!ordersSheet || ordersSheet.getLastRow() <= 1) {
    SpreadsheetApp.getUi().alert('📭 Belum ada data order.');
    return;
  }
  
  const data = ordersSheet.getDataRange().getValues();
  let total = 0;
  let pending = 0;
  let completed = 0;
  let revenue = 0;
  
  for (let i = 1; i < data.length; i++) {
    total++;
    if (data[i][3] === 'pending') pending++;
    if (data[i][3] === 'completed') {
      completed++;
      revenue += Number(data[i][4]) || 0;
    }
  }
  
  SpreadsheetApp.getUi().alert(
    '📊 Statistik Order',
    `Total Order: ${total}\n` +
    `Pending: ${pending}\n` +
    `Completed: ${completed}\n` +
    `Total Revenue: Rp ${revenue.toLocaleString('id-ID')}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function showSheetId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  SpreadsheetApp.getUi().alert(
    '🔗 Sheet ID',
    'Copy Sheet ID ini dan paste ke google-apps-script.js:\n\n' +
    ss.getId(),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function showHelp() {
  SpreadsheetApp.getUi().alert(
    '❓ Bantuan Hapiyo Coffee',
    'CARA SETUP:\n' +
    '1. Jalankan "Setup Database" dari menu\n' +
    '2. Copy Sheet ID (Get Sheet ID)\n' +
    '3. Paste ke file google-apps-script.js\n' +
    '4. Deploy Apps Script sebagai Web App\n\n' +
    'SHEETS:\n' +
    '• Orders: Data pesanan\n' +
    '• OrderItems: Detail item pesanan\n' +
    '• Config: Konfigurasi toko\n' +
    '• DailySummary: Ringkasan harian\n' +
    '• MenuSync: Backup menu\n\n' +
    'Dokumentasi: Lihat README.md',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ============================================
// TEST FUNCTIONS
// ============================================

/**
 * Test dengan menambah order dummy
 */
function testAddOrder() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ordersSheet = ss.getSheetByName('Orders');
  const itemsSheet = ss.getSheetByName('OrderItems');
  
  if (!ordersSheet || !itemsSheet) {
    Logger.log('❌ Sheets not found. Run setupDatabase() first.');
    return;
  }
  
  const orderId = generateOrderId();
  const now = new Date().toISOString();
  
  // Add order
  const orderRow = [
    orderId,
    '5',
    'Test Customer',
    'pending',
    75000,
    3,
    'Test order',
    now,
    now,
    ''
  ];
  ordersSheet.appendRow(orderRow);
  
  // Add order items
  const items = [
    [orderId + '-1', orderId, 'coffee_001', 'Hapiyo Latte', 'coffee', 2, 25000, 50000, '', now],
    [orderId + '-2', orderId, 'snack_001', 'Butter Croissant', 'snacks', 1, 25000, 25000, '', now]
  ];
  
  items.forEach(item => itemsSheet.appendRow(item));
  
  Logger.log('✅ Test order added: ' + orderId);
  SpreadsheetApp.getUi().alert('✅ Test order berhasil ditambahkan!\n\nOrder ID: ' + orderId);
}
