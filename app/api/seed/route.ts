import { kv } from '@/lib/redis';
import { NextResponse } from 'next/server';

interface MenuItem {
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

const initialMenu: MenuItem[] = [
  // Coffee
  {
    id: 'coffee_001',
    category: 'coffee',
    name: 'Hapiyo Latte',
    price: 25000,
    description: 'Smooth latte dengan espresso blend khas Hapiyo',
    image: 'https://images.unsplash.com/photo-1561047029-3000c68339ca?w=400',
    available: true,
    stock: 50
  },
  {
    id: 'coffee_002',
    category: 'coffee',
    name: 'Cappuccino',
    price: 23000,
    description: 'Classic cappuccino dengan foam sempurna',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
    available: true,
    stock: 50
  },
  {
    id: 'coffee_003',
    category: 'coffee',
    name: 'Americano',
    price: 20000,
    description: 'Espresso dengan air panas, bold dan rich',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
    available: true,
    stock: 50
  },
  {
    id: 'coffee_004',
    category: 'coffee',
    name: 'Espresso',
    price: 18000,
    description: 'Shot espresso murni, intense flavor',
    image: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400',
    available: true,
    stock: 50
  },
  {
    id: 'coffee_005',
    category: 'coffee',
    name: 'Hapiyo Mocha',
    price: 28000,
    description: 'Latte dengan dark chocolate premium',
    image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400',
    available: true,
    stock: 40
  },
  {
    id: 'coffee_006',
    category: 'coffee',
    name: 'Caramel Macchiato',
    price: 28000,
    description: 'Espresso dengan vanilla dan caramel drizzle',
    image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400',
    available: true,
    stock: 40
  },
  // Non-Coffee
  {
    id: 'non_coffee_001',
    category: 'non-coffee',
    name: 'Chocolate Hazelnut',
    price: 28000,
    description: 'Rich chocolate dengan hazelnut premium',
    image: 'https://images.unsplash.com/photo-1542990253-a781e04c0082?w=400',
    available: true,
    stock: 30
  },
  {
    id: 'non_coffee_002',
    category: 'non-coffee',
    name: 'Matcha Latte',
    price: 26000,
    description: 'Japanese matcha dengan susu creamy',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400',
    available: true,
    stock: 30
  },
  {
    id: 'non_coffee_003',
    category: 'non-coffee',
    name: 'Thai Tea',
    price: 22000,
    description: 'Thai tea autentik dengan susu',
    image: 'https://images.unsplash.com/photo-1558857563-c90f3d484f11?w=400',
    available: true,
    stock: 30
  },
  {
    id: 'non_coffee_004',
    category: 'non-coffee',
    name: 'Taro Latte',
    price: 25000,
    description: 'Creamy taro dengan susu segar',
    image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=400',
    available: true,
    stock: 25
  },
  // Pastry/Snacks
  {
    id: 'snack_001',
    category: 'snacks',
    name: 'Butter Croissant',
    price: 20000,
    description: 'Croissant butter fresh dari oven',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
    available: true,
    stock: 20
  },
  {
    id: 'snack_002',
    category: 'snacks',
    name: 'Chocolate Croissant',
    price: 23000,
    description: 'Croissant dengan filling chocolate',
    image: 'https://images.unsplash.com/photo-1623334044303-241021148842?w=400',
    available: true,
    stock: 15
  },
  {
    id: 'snack_003',
    category: 'snacks',
    name: 'Cinnamon Roll',
    price: 22000,
    description: 'Soft cinnamon roll dengan cream cheese frosting',
    image: 'https://images.unsplash.com/photo-1609127102567-8a9a21dc27d8?w=400',
    available: true,
    stock: 15
  },
  {
    id: 'snack_004',
    category: 'snacks',
    name: 'Banana Bread',
    price: 18000,
    description: 'Homemade banana bread moist dan lembut',
    image: 'https://images.unsplash.com/photo-1605286978633-2dec93d83a49?w=400',
    available: true,
    stock: 12
  },
  // Meals
  {
    id: 'meal_001',
    category: 'meals',
    name: 'Chicken Sandwich',
    price: 35000,
    description: 'Grilled chicken dengan fresh vegetables',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400',
    available: true,
    stock: 10
  },
  {
    id: 'meal_002',
    category: 'meals',
    name: 'Beef Burger',
    price: 45000,
    description: 'Homemade beef patty dengan special sauce',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    available: true,
    stock: 10
  },
  {
    id: 'meal_003',
    category: 'meals',
    name: 'Pasta Carbonara',
    price: 42000,
    description: 'Creamy carbonara dengan bacon crispy',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400',
    available: true,
    stock: 8
  },
  {
    id: 'meal_004',
    category: 'meals',
    name: 'Nasi Goreng Special',
    price: 38000,
    description: 'Nasi goreng dengan telur, ayam, dan kerupuk',
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
    available: true,
    stock: 15
  }
];

// API Route to seed menu data
export async function POST() {
  try {
    console.log('Starting menu seed...');
    
    // Clear existing data (optional - be careful in production!)
    const existingCategories = await kv.smembers('categories') || [];
    for (const cat of existingCategories) {
      const menuIds = await kv.lrange(`menu:index:${cat}`, 0, -1) || [];
      for (const id of menuIds) {
        await kv.del(`menu:${cat}:${id}`);
      }
      await kv.del(`menu:index:${cat}`);
    }
    await kv.del('categories');
    
    console.log('Cleared existing data');

    // Seed new menu items
    const results = [];
    for (const menu of initialMenu) {
      await kv.hset(`menu:${menu.category}:${menu.id}`, menu);
      await kv.lpush(`menu:index:${menu.category}`, menu.id);
      await kv.sadd('categories', menu.category);
      results.push({ id: menu.id, name: menu.name, status: 'added' });
      console.log(`✓ Added ${menu.name}`);
    }

    console.log('✓ Seeding complete!');

    return NextResponse.json({
      success: true,
      message: 'Menu seeded successfully',
      itemsAdded: results.length,
      items: results
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to check current seed status
export async function GET() {
  try {
    const categories = await kv.smembers('categories') || [];
    let totalItems = 0;
    
    const categoryDetails = await Promise.all(
      (categories as string[]).map(async (cat) => {
        const count = await kv.llen(`menu:index:${cat}`);
        totalItems += count || 0;
        return { category: cat, count };
      })
    );

    return NextResponse.json({
      success: true,
      message: totalItems > 0 ? 'Database has menu items' : 'Database is empty',
      totalItems,
      categories: categoryDetails
    });
  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
