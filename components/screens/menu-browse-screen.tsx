"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ShoppingCart, Minus, Plus, Loader2 } from "lucide-react"
import { getAllMenus, formatPrice, type MenuItem } from "@/lib/menuService"

interface CartItem extends MenuItem {
  quantity: number
}

interface MenuBrowseScreenProps {
  tableNumber: string
  onCheckout: (cart: CartItem[]) => void
}

export function MenuBrowseScreen({ tableNumber, onCheckout }: MenuBrowseScreenProps) {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const loadMenus = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getAllMenus()
      if (result.success && result.menus) {
        // Only show available items with stock
        const availableMenus = result.menus.filter(m => m.available && m.stock > 0)
        setMenus(availableMenus)
        
        // Set first category as default
        if (result.categories && result.categories.length > 0) {
          setSelectedCategory(result.categories[0])
        } else if (availableMenus.length > 0) {
          const cats = [...new Set(availableMenus.map(m => m.category))]
          if (cats.length > 0) setSelectedCategory(cats[0])
        }
      }
    } catch (error) {
      console.error("Error loading menus:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMenus()
  }, [loadMenus])

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(`hapiyo_cart_${tableNumber}`)
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error("Error loading cart:", error)
      }
    }
  }, [tableNumber])

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem(`hapiyo_cart_${tableNumber}`, JSON.stringify(cart))
  }, [cart, tableNumber])

  const categories = useMemo(() => 
    [...new Set(menus.map((item) => item.category))], 
    [menus]
  )

  const filteredMenu = useMemo(() => 
    menus.filter((item) => item.category === selectedCategory), 
    [menus, selectedCategory]
  )

  const cartTotal = useMemo(() => 
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0), 
    [cart]
  )

  const cartItemCount = useMemo(() =>
    cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  )

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id)
      if (existing) {
        // Check stock limit
        if (existing.quantity >= item.stock) {
          return prev
        }
        return prev.map((p) => (p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p))
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    const item = menus.find(m => m.id === itemId)
    if (quantity <= 0) {
      setCart((prev) => prev.filter((p) => p.id !== itemId))
    } else if (item && quantity <= item.stock) {
      setCart((prev) => prev.map((p) => (p.id === itemId ? { ...p, quantity } : p)))
    }
  }

  const getCartQuantity = (itemId: string) => {
    const item = cart.find(c => c.id === itemId)
    return item?.quantity || 0
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Memuat menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border p-4 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-primary">Hapiyo Coffee</h1>
              <p className="text-sm text-muted-foreground">Meja {tableNumber}</p>
            </div>
            <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-full">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span className="font-semibold text-primary">{cartItemCount}</span>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors capitalize ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-muted/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        {filteredMenu.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Tidak ada menu tersedia di kategori ini</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenu.map((item) => {
              const cartQty = getCartQuantity(item.id)
              return (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img 
                      src={item.image || "/placeholder.svg"} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg"
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-lg text-foreground">{item.name}</h3>
                      {item.stock <= 5 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                          Sisa {item.stock}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">{formatPrice(item.price)}</span>
                      {cartQty === 0 ? (
                        <Button
                          onClick={() => addToCart(item)}
                          size="sm"
                          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Tambah
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 bg-muted rounded-full px-2 py-1">
                          <button
                            onClick={() => updateQuantity(item.id, cartQty - 1)}
                            className="p-1 hover:bg-background rounded-full"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-semibold">{cartQty}</span>
                          <button
                            onClick={() => updateQuantity(item.id, cartQty + 1)}
                            className="p-1 hover:bg-background rounded-full"
                            disabled={cartQty >= item.stock}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg z-40">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-4">
              {/* Cart Items Summary */}
              <div className="max-h-32 overflow-y-auto space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-muted p-2 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 hover:bg-background rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-6 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 hover:bg-background rounded"
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout Button */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total ({cartItemCount} item):</span>
                  <span className="text-primary">{formatPrice(cartTotal)}</span>
                </div>
                <Button
                  onClick={() => onCheckout(cart)}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 font-bold text-lg"
                >
                  Lanjutkan ke Pembayaran
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
