import { kv } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all categories
export async function GET() {
  try {
    const categories = await kv.smembers('categories') || [];
    
    // Get count of items per category
    const categoriesWithCount = await Promise.all(
      (categories as string[]).map(async (category) => {
        const count = await kv.llen(`menu:index:${category}`);
        return {
          name: category,
          count: count || 0
        };
      })
    );

    return NextResponse.json({ 
      success: true,
      categories: categoriesWithCount
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST - Add new category
export async function POST(request: NextRequest) {
  try {
    const { name }: { name: string } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    const categoryName = name.trim().toLowerCase();
    
    // Check if category already exists
    const exists = await kv.sismember('categories', categoryName);
    if (exists) {
      return NextResponse.json(
        { success: false, error: 'Category already exists' },
        { status: 409 }
      );
    }

    await kv.sadd('categories', categoryName);

    return NextResponse.json({ 
      success: true, 
      category: categoryName,
      message: 'Category created successfully'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// DELETE - Remove empty category
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category has items
    const itemCount = await kv.llen(`menu:index:${name}`);
    if (itemCount && itemCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category with menu items. Remove all items first.' },
        { status: 400 }
      );
    }

    await kv.srem('categories', name);

    return NextResponse.json({ 
      success: true, 
      category: name,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}
