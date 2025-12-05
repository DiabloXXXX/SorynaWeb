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

// GET - Fetch all menus or by category
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    if (category) {
      // Get menu by category
      const menuIds = await kv.lrange(`menu:index:${category}`, 0, -1) || [];
      const menus = await Promise.all(
        menuIds.map(id => kv.hgetall<MenuItem>(`menu:${category}:${id}`))
      );
      return NextResponse.json({ 
        success: true,
        menus: menus.filter((m): m is MenuItem => m !== null) 
      });
    } else {
      // Get all categories and their menus
      const categories = await kv.smembers('categories') || [];
      const allMenus: MenuItem[] = [];

      for (const cat of categories) {
        const menuIds = await kv.lrange(`menu:index:${cat}`, 0, -1) || [];
        const menus = await Promise.all(
          menuIds.map(id => kv.hgetall<MenuItem>(`menu:${cat}:${id}`))
        );
        allMenus.push(...menus.filter((m): m is MenuItem => m !== null));
      }

      return NextResponse.json({ 
        success: true,
        menus: allMenus,
        categories: categories as string[]
      });
    }
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch menus' },
      { status: 500 }
    );
  }
}

// POST - Create new menu item (Admin only)
export async function POST(request: NextRequest) {
  try {
    const menuData: MenuItem = await request.json();
    const { id, category, name, price, description, image, available, stock } = menuData;

    // Validate required fields
    if (!id || !category || !name || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, category, name, price' },
        { status: 400 }
      );
    }

    // Check if menu already exists
    const existing = await kv.exists(`menu:${category}:${id}`);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Menu with this ID already exists' },
        { status: 409 }
      );
    }

    // Store menu as hash
    const menuItem: MenuItem = {
      id,
      category,
      name,
      price,
      description: description || '',
      image: image || '',
      available: available !== false,
      stock: stock || 0
    };

    await kv.hset(`menu:${category}:${id}`, menuItem);

    // Add to category index (at the beginning for newest first)
    await kv.lpush(`menu:index:${category}`, id);

    // Add category to categories set
    await kv.sadd('categories', category);

    return NextResponse.json({ 
      success: true, 
      menu: menuItem,
      message: 'Menu created successfully'
    });
  } catch (error) {
    console.error('Error creating menu:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create menu' },
      { status: 500 }
    );
  }
}
