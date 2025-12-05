// Cart Context - Global cart state management
"use client"

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { MenuItem } from './menuService';

// ============================================
// TYPES
// ============================================

export interface CartItem extends MenuItem {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  tableNumber: string | null;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: MenuItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_TABLE'; payload: string }
  | { type: 'LOAD_CART'; payload: CartState };

interface CartContextType {
  items: CartItem[];
  tableNumber: string | null;
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setTable: (tableNumber: string) => void;
  getItemQuantity: (id: string) => number;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// ============================================
// REDUCER
// ============================================

const CART_STORAGE_KEY = 'hapiyo_cart';

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingIndex = state.items.findIndex(item => item.id === action.payload.id);
      
      if (existingIndex >= 0) {
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity: newItems[existingIndex].quantity + 1,
        };
        return { ...state, items: newItems };
      }
      
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }],
      };
    }
    
    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };
    }
    
    case 'UPDATE_QUANTITY': {
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload.id),
        };
      }
      
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    }
    
    case 'CLEAR_CART': {
      return { ...state, items: [] };
    }
    
    case 'SET_TABLE': {
      return { ...state, tableNumber: action.payload };
    }
    
    case 'LOAD_CART': {
      return action.payload;
    }
    
    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

const CartContext = createContext<CartContextType | undefined>(undefined);

const initialState: CartState = {
  items: [],
  tableNumber: null,
};

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsed });
      } catch (error) {
        console.error('Error loading cart from storage:', error);
      }
    }
  }, []);

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addItem = (item: MenuItem) => {
    if (!item.available) {
      console.warn('Cannot add unavailable item to cart');
      return;
    }
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const setTable = (tableNumber: string) => {
    dispatch({ type: 'SET_TABLE', payload: tableNumber });
  };

  const getItemQuantity = (id: string): number => {
    const item = state.items.find(item => item.id === id);
    return item?.quantity || 0;
  };

  const getTotalItems = (): number => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = (): number => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const value: CartContextType = {
    items: state.items,
    tableNumber: state.tableNumber,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setTable,
    getItemQuantity,
    getTotalItems,
    getTotalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

// ============================================
// UTILITY
// ============================================

/**
 * Convert cart items to order format
 */
export function cartToOrderItems(items: CartItem[]) {
  return items.map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.price * item.quantity,
  }));
}
