// Menu Service - Client-side API calls for menu operations
// Uses Next.js API Routes which connect to Vercel KV (Redis)

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  available: boolean;
  stock: number;
}

export interface Category {
  name: string;
  count: number;
}

export interface MenuResponse {
  success: boolean;
  menus?: MenuItem[];
  categories?: string[];
  error?: string;
}

export interface SingleMenuResponse {
  success: boolean;
  menu?: MenuItem;
  message?: string;
  error?: string;
}

export interface CategoryResponse {
  success: boolean;
  categories?: Category[];
  error?: string;
}

// ============================================
// MENU OPERATIONS
// ============================================

/**
 * Fetch all menus from the database
 */
export async function getAllMenus(): Promise<MenuResponse> {
  try {
    const response = await fetch('/api/menu', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  } catch (error) {
    console.error('Error fetching menus:', error);
    return { success: false, error: 'Failed to fetch menus' };
  }
}

/**
 * Fetch menus by category
 */
export async function getMenuByCategory(category: string): Promise<MenuResponse> {
  try {
    const response = await fetch(`/api/menu?category=${encodeURIComponent(category)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  } catch (error) {
    console.error('Error fetching menus by category:', error);
    return { success: false, error: 'Failed to fetch menus' };
  }
}

/**
 * Fetch a single menu by ID
 */
export async function getMenuById(id: string): Promise<SingleMenuResponse> {
  try {
    const response = await fetch(`/api/menu/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  } catch (error) {
    console.error('Error fetching menu:', error);
    return { success: false, error: 'Failed to fetch menu' };
  }
}

/**
 * Create a new menu item (Admin only)
 */
export async function createMenu(menuData: Omit<MenuItem, 'id'> & { id?: string }): Promise<SingleMenuResponse> {
  try {
    const id = menuData.id || `${menuData.category}_${Date.now()}`;
    const response = await fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...menuData, id }),
    });
    return response.json();
  } catch (error) {
    console.error('Error creating menu:', error);
    return { success: false, error: 'Failed to create menu' };
  }
}

/**
 * Update an existing menu item (Admin only)
 */
export async function updateMenu(id: string, updates: Partial<MenuItem>): Promise<SingleMenuResponse> {
  try {
    const response = await fetch(`/api/menu/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return response.json();
  } catch (error) {
    console.error('Error updating menu:', error);
    return { success: false, error: 'Failed to update menu' };
  }
}

/**
 * Delete a menu item (Admin only)
 */
export async function deleteMenu(id: string): Promise<SingleMenuResponse> {
  try {
    const response = await fetch(`/api/menu/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  } catch (error) {
    console.error('Error deleting menu:', error);
    return { success: false, error: 'Failed to delete menu' };
  }
}

/**
 * Toggle menu availability (Admin only)
 */
export async function toggleMenuAvailability(id: string, available: boolean): Promise<SingleMenuResponse> {
  return updateMenu(id, { available });
}

// ============================================
// STOCK OPERATIONS
// ============================================

interface StockUpdateResult {
  success: boolean;
  id?: string;
  previousStock?: number;
  newStock?: number;
  available?: boolean;
  message?: string;
  error?: string;
}

/**
 * Update stock for a single menu item
 */
export async function updateStock(
  id: string, 
  category: string, 
  quantity: number
): Promise<StockUpdateResult> {
  try {
    const response = await fetch('/api/menu/stock', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, category, quantity }),
    });
    return response.json();
  } catch (error) {
    console.error('Error updating stock:', error);
    return { success: false, error: 'Failed to update stock' };
  }
}

/**
 * Bulk update stock for multiple items
 */
export async function bulkUpdateStock(
  updates: Array<{ id: string; category: string; quantity: number }>
): Promise<{ success: boolean; results?: StockUpdateResult[]; error?: string }> {
  try {
    const response = await fetch('/api/menu/stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    return response.json();
  } catch (error) {
    console.error('Error bulk updating stock:', error);
    return { success: false, error: 'Failed to bulk update stock' };
  }
}

// ============================================
// CATEGORY OPERATIONS
// ============================================

/**
 * Fetch all categories with item counts
 */
export async function getCategories(): Promise<CategoryResponse> {
  try {
    const response = await fetch('/api/categories', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

/**
 * Create a new category
 */
export async function createCategory(name: string): Promise<{ success: boolean; category?: string; error?: string }> {
  try {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return response.json();
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: 'Failed to create category' };
  }
}

/**
 * Delete an empty category
 */
export async function deleteCategory(name: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/categories?name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Failed to delete category' };
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format price to Indonesian Rupiah
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Get available menus only
 */
export async function getAvailableMenus(): Promise<MenuResponse> {
  const result = await getAllMenus();
  if (result.success && result.menus) {
    return {
      ...result,
      menus: result.menus.filter(menu => menu.available && menu.stock > 0),
    };
  }
  return result;
}

/**
 * Group menus by category
 */
export function groupMenusByCategory(menus: MenuItem[]): Record<string, MenuItem[]> {
  return menus.reduce((acc, menu) => {
    if (!acc[menu.category]) {
      acc[menu.category] = [];
    }
    acc[menu.category].push(menu);
    return acc;
  }, {} as Record<string, MenuItem[]>);
}
