"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Loader2, ArrowLeft, AlertTriangle } from "lucide-react"
import { createOrder, checkTableAvailability, type OrderItem, type Order } from "@/lib/orderService"
import { formatPrice, type MenuItem } from "@/lib/menuService"

interface CartItem extends MenuItem {
  quantity: number
}

interface OrderCheckoutScreenProps {
  tableNumber: string
  cart: CartItem[]
  onOrderConfirmed: (orderId: string, customerName: string, total: number) => void
  onBack: () => void
}

export function OrderCheckoutScreen({ tableNumber, cart, onOrderConfirmed, onBack }: OrderCheckoutScreenProps) {
  const [customerName, setCustomerName] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [orderConfirmed, setOrderConfirmed] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  
  // Table availability check
  const [checkingTable, setCheckingTable] = useState(true)
  const [tableAvailable, setTableAvailable] = useState(true)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)

  const total = useMemo(() => 
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  )

  // Check if table has active order on mount
  useEffect(() => {
    const checkTable = async () => {
      setCheckingTable(true)
      try {
        const result = await checkTableAvailability(tableNumber)
        setTableAvailable(result.available)
        if (!result.available && result.activeOrder) {
          setActiveOrder(result.activeOrder)
        }
      } catch (error) {
        console.error("Error checking table:", error)
        // Allow order if check fails
        setTableAvailable(true)
      } finally {
        setCheckingTable(false)
      }
    }
    
    checkTable()
  }, [tableNumber])

  const handleConfirmOrder = async () => {
    if (!customerName.trim()) {
      alert("Masukkan nama Anda")
      return
    }

    if (cart.length === 0) {
      alert("Keranjang kosong")
      return
    }

    setIsLoading(true)

    try {
      const orderItems: OrderItem[] = cart.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }))

      const result = await createOrder({
        table: tableNumber,
        items: orderItems,
        notes: notes.trim(),
        customerName: customerName.trim(),
      })

      if (result.success && result.orderId) {
        setOrderId(result.orderId)
        setOrderConfirmed(true)
        
        // Clear cart from localStorage
        localStorage.removeItem(`hapiyo_cart_${tableNumber}`)

        // Wait a moment to show success state
        setTimeout(() => {
          onOrderConfirmed(result.orderId!, customerName, total)
        }, 2000)
      } else {
        alert(result.error || "Gagal membuat pesanan. Silakan coba lagi.")
      }
    } catch (error) {
      console.error("Error creating order:", error)
      alert("Terjadi kesalahan. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  if (orderConfirmed && orderId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
        <Card className="w-full max-w-md p-8 text-center shadow-lg">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Pesanan Diterima!</h2>
            <p className="text-muted-foreground mb-4">Pesanan Anda sedang disiapkan</p>
            <div className="bg-muted p-4 rounded-lg mb-4">
              <p className="text-sm text-muted-foreground mb-2">Order ID</p>
              <p className="text-xl font-bold text-primary font-mono">{orderId}</p>
            </div>
            <p className="text-sm text-muted-foreground">Kami akan memberitahu Anda saat pesanan siap</p>
          </div>
        </Card>
      </div>
    )
  }

  // Show loading while checking table availability
  if (checkingTable) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
        <Card className="w-full max-w-md p-8 text-center shadow-lg">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Memeriksa ketersediaan meja...</p>
        </Card>
      </div>
    )
  }

  // Show warning if table has active order
  if (!tableAvailable && activeOrder) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
        <Card className="w-full max-w-md p-8 text-center shadow-lg border-yellow-300">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
              <AlertTriangle className="w-12 h-12 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Meja Sedang Digunakan</h2>
            <p className="text-muted-foreground mb-4">
              Meja <span className="font-bold">#{tableNumber}</span> masih memiliki pesanan aktif
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4 text-left">
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Order ID:</span>{" "}
                  <span className="font-mono font-bold">{activeOrder.orderId}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Nama:</span>{" "}
                  <span className="font-semibold">{activeOrder.customerName || "Guest"}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <span className={`font-semibold ${
                    activeOrder.status === 'pending' ? 'text-yellow-600' :
                    activeOrder.status === 'preparing' ? 'text-blue-600' :
                    activeOrder.status === 'ready' ? 'text-green-600' : ''
                  }`}>
                    {activeOrder.status === 'pending' ? 'Menunggu' :
                     activeOrder.status === 'preparing' ? 'Sedang Diproses' :
                     activeOrder.status === 'ready' ? 'Siap Diambil' : activeOrder.status}
                  </span>
                </p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              Silakan gunakan meja lain atau tunggu hingga pesanan selesai
            </p>
            
            <Button onClick={onBack} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali & Ganti Meja
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} disabled={isLoading}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Konfirmasi Pesanan</h1>
            <p className="text-sm text-muted-foreground">Meja {tableNumber}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Order Items */}
        <Card className="p-4">
          <h2 className="font-bold text-lg mb-4">Pesanan Anda ({cart.length} item)</h2>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center pb-3 border-b border-border last:border-0">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    x{item.quantity} @ {formatPrice(item.price)}
                  </p>
                </div>
                <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Customer Info */}
        <Card className="p-4 space-y-4">
          <h2 className="font-bold text-lg">Informasi Pesanan</h2>
          <div>
            <label className="block text-sm font-medium mb-2">Nama Anda *</label>
            <Input
              placeholder="Nama untuk pesanan"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Catatan (Opsional)</label>
            <textarea
              placeholder="Misalnya: kurangi gula, tambah es, dll"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground min-h-[80px] resize-none"
            />
          </div>
        </Card>

        {/* Total */}
        <Card className="p-4 bg-muted">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatPrice(total)}</span>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleConfirmOrder}
            disabled={isLoading || cart.length === 0}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 font-bold text-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Memproses...
              </>
            ) : (
              "Konfirmasi Pesanan"
            )}
          </Button>
          <Button 
            variant="outline" 
            className="w-full h-12 font-semibold bg-transparent" 
            disabled={isLoading}
            onClick={onBack}
          >
            Kembali ke Menu
          </Button>
        </div>
      </div>
    </div>
  )
}
