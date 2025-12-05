import { NextRequest, NextResponse } from 'next/server';

// Proxy to Google Apps Script to avoid CORS issues
const GAS_URL = process.env.NEXT_PUBLIC_GAS_API_URL || '';

// Simple in-memory cache for faster responses
let ordersCache: { data: unknown; timestamp: number } | null = null;
let statsCache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 3000; // 3 seconds cache

function isCacheValid(cache: { timestamp: number } | null): boolean {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_TTL;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'getOrders';
  const noCache = searchParams.get('noCache') === 'true';
  
  if (!GAS_URL) {
    return NextResponse.json({ error: 'GAS API URL not configured' }, { status: 500 });
  }

  // Check cache first for common read operations
  if (!noCache) {
    if (action === 'getOrders' && isCacheValid(ordersCache)) {
      return NextResponse.json(ordersCache!.data);
    }
    if (action === 'getStats' && isCacheValid(statsCache)) {
      return NextResponse.json(statsCache!.data);
    }
  }

  try {
    // Build URL with all params
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key !== 'noCache') params.append(key, value);
    });
    
    const url = `${GAS_URL}?${params.toString()}`;
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    const data = await response.json();
    
    // Update cache
    if (action === 'getOrders') {
      ordersCache = { data, timestamp: Date.now() };
    } else if (action === 'getStats') {
      statsCache = { data, timestamp: Date.now() };
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('GAS Proxy GET error:', error);
    
    // Return cached data if available on error
    if (action === 'getOrders' && ordersCache) {
      return NextResponse.json(ordersCache.data);
    }
    if (action === 'getStats' && statsCache) {
      return NextResponse.json(statsCache.data);
    }
    
    return NextResponse.json({ error: 'Failed to fetch from GAS' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (!GAS_URL) {
    return NextResponse.json({ error: 'GAS API URL not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    
    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for POST
    
    const response = await fetch(`${GAS_URL}?action=${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    const data = await response.json();
    
    // Invalidate cache on write operations
    if (['createOrder', 'updateOrderStatus', 'deleteOrder'].includes(action || '')) {
      ordersCache = null;
      statsCache = null;
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('GAS Proxy POST error:', error);
    return NextResponse.json({ error: 'Failed to post to GAS' }, { status: 500 });
  }
}
