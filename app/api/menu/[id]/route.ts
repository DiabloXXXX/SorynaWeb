import { kv } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  available: boolean;
  stock: number;
  [key: string]: string | number | boolean; // Index signature for KV compatibility
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Fetch single menu by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Search across all categories
    const categories = await kv.smembers('categories') || [];
    
    for (const cat of categories) {
      const menu = await kv.hgetall<MenuItem>(`menu:${cat}:${id}`);
      if (menu && menu.id) {
        return NextResponse.json({ 
          success: true, 
          menu 
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Menu not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}

// PUT - Update menu item
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const updates: Partial<MenuItem> = await request.json();

    // Find existing menu
    const categories = await kv.smembers('categories') || [];
    let existingMenu: MenuItem | null = null;
    let foundCategory: string | null = null;

    for (const cat of categories) {
      const menu = await kv.hgetall<MenuItem>(`menu:${cat}:${id}`);
      if (menu && menu.id) {
        existingMenu = menu;
        foundCategory = cat as string;
        break;
      }
    }

    if (!existingMenu || !foundCategory) {
      return NextResponse.json(
        { success: false, error: 'Menu not found' },
        { status: 404 }
      );
    }

    // Handle category change
    if (updates.category && updates.category !== foundCategory) {
      // Remove from old category
      await kv.del(`menu:${foundCategory}:${id}`);
      await kv.lrem(`menu:index:${foundCategory}`, 0, id);

      // Add to new category
      const newCategory = updates.category;
      const updatedMenu: MenuItem = { ...existingMenu, ...updates, id };
      await kv.hset(`menu:${newCategory}:${id}`, updatedMenu);
      await kv.lpush(`menu:index:${newCategory}`, id);
      await kv.sadd('categories', newCategory);

      return NextResponse.json({ 
        success: true, 
        menu: updatedMenu,
        message: 'Menu updated successfully'
      });
    }

    // Update menu in same category
    const updatedMenu: MenuItem = { ...existingMenu, ...updates, id };
    await kv.hset(`menu:${foundCategory}:${id}`, updatedMenu);

    return NextResponse.json({ 
      success: true, 
      menu: updatedMenu,
      message: 'Menu updated successfully'
    });
  } catch (error) {
    console.error('Error updating menu:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update menu' },
      { status: 500 }
    );
  }
}

// DELETE - Delete menu item
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Find and delete menu
    const categories = await kv.smembers('categories') || [];
    let deleted = false;
    let deletedCategory: string | null = null;

    for (const cat of categories) {
      const exists = await kv.exists(`menu:${cat}:${id}`);
      if (exists) {
        await kv.del(`menu:${cat}:${id}`);
        await kv.lrem(`menu:index:${cat}`, 0, id);
        deleted = true;
        deletedCategory = cat as string;
        break;
      }
    }

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Menu not found' },
        { status: 404 }
      );
    }

    // Check if category is empty and clean up
    if (deletedCategory) {
      const remainingItems = await kv.llen(`menu:index:${deletedCategory}`);
      if (remainingItems === 0) {
        await kv.srem('categories', deletedCategory);
      }
    }

    return NextResponse.json({ 
      success: true, 
      id,
      message: 'Menu deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting menu:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete menu' },
      { status: 500 }
    );
  }
}
