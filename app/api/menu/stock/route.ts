import { kv } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

interface StockUpdate {
  id: string;
  category: string;
  quantity: number; // positive to add, negative to subtract
}

// PATCH - Update stock for a menu item
export async function PATCH(request: NextRequest) {
  try {
    const { id, category, quantity }: StockUpdate = await request.json();

    if (!id || !category || quantity === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id, category, quantity' },
        { status: 400 }
      );
    }

    // Check if menu exists
    const menu = await kv.hgetall(`menu:${category}:${id}`);
    if (!menu || !(menu as Record<string, unknown>).id) {
      return NextResponse.json(
        { success: false, error: 'Menu not found' },
        { status: 404 }
      );
    }

    const currentStock = Number((menu as Record<string, unknown>).stock) || 0;
    const newStock = Math.max(0, currentStock + quantity);

    // Update stock
    await kv.hset(`menu:${category}:${id}`, { stock: newStock });

    // Auto-update availability based on stock
    const available = newStock > 0;
    await kv.hset(`menu:${category}:${id}`, { available });

    return NextResponse.json({
      success: true,
      id,
      previousStock: currentStock,
      newStock,
      available,
      message: `Stock updated from ${currentStock} to ${newStock}`
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update stock' },
      { status: 500 }
    );
  }
}

// POST - Bulk update stock (for restocking multiple items)
export async function POST(request: NextRequest) {
  try {
    const { updates }: { updates: StockUpdate[] } = await request.json();

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, error: 'Missing updates array' },
        { status: 400 }
      );
    }

    const results = [];

    for (const update of updates) {
      const { id, category, quantity } = update;

      const menu = await kv.hgetall(`menu:${category}:${id}`);
      if (!menu || !(menu as Record<string, unknown>).id) {
        results.push({ id, success: false, error: 'Menu not found' });
        continue;
      }

      const currentStock = Number((menu as Record<string, unknown>).stock) || 0;
      const newStock = Math.max(0, currentStock + quantity);
      const available = newStock > 0;

      await kv.hset(`menu:${category}:${id}`, { stock: newStock, available });

      results.push({
        id,
        success: true,
        previousStock: currentStock,
        newStock,
        available
      });
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Processed ${results.length} stock updates`
    });
  } catch (error) {
    console.error('Error bulk updating stock:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to bulk update stock' },
      { status: 500 }
    );
  }
}
