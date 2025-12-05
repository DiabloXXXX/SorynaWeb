"use client"

import { useState, useEffect } from "react"
import { QRScanScreen } from "@/components/screens/qr-scan-screen"
import { MenuBrowseScreen } from "@/components/screens/menu-browse-screen"
import { OrderCheckoutScreen } from "@/components/screens/order-checkout-screen"
import { OrderConfirmationScreen } from "@/components/screens/order-confirmation-screen"
import { OrderTrackingScreen } from "@/components/screens/order-tracking-screen"
import type { MenuItem } from "@/lib/menuService"

type Screen = "qr-scan" | "menu-browse" | "order-checkout" | "order-confirmation" | "order-tracking"

interface CartItem extends MenuItem {
  quantity: number
}

interface OrderData {
  orderId: string
  tableNumber: string
  customerName: string
  total: number
}

export default function HomePage() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("qr-scan")
  const [tableNumber, setTableNumber] = useState<string | null>(null)
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])

  // Check for table parameter in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const table = params.get("table")
    if (table) {
      setTableNumber(table)
      setCurrentScreen("menu-browse")
    }
  }, [])

  const handleTableIdentified = (table: string) => {
    setTableNumber(table)
    setCurrentScreen("menu-browse")
    // Update URL without page reload
    window.history.pushState({}, "", `?table=${table}`)
  }

  const handleCheckout = (cartItems: CartItem[]) => {
    setCart(cartItems)
    setCurrentScreen("order-checkout")
  }

  const handleBackToMenu = () => {
    setCurrentScreen("menu-browse")
  }

  const handleOrderConfirmed = (orderId: string, customerName: string, total: number) => {
    if (tableNumber) {
      setOrderData({
        orderId,
        tableNumber,
        customerName,
        total,
      })
      setCart([]) // Clear cart after order
      setCurrentScreen("order-confirmation")
    }
  }

  const handleViewStatus = () => {
    if (orderData) {
      setCurrentScreen("order-tracking")
    }
  }

  const handleNewOrder = () => {
    setOrderData(null)
    setCart([])
    setCurrentScreen("menu-browse")
  }

  const handleBackToStart = () => {
    setTableNumber(null)
    setOrderData(null)
    setCart([])
    setCurrentScreen("qr-scan")
    // Clear URL parameters
    window.history.pushState({}, "", window.location.pathname)
  }

  return (
    <div className="min-h-screen bg-background">
      {currentScreen === "qr-scan" && <QRScanScreen onTableIdentified={handleTableIdentified} />}
      {currentScreen === "menu-browse" && tableNumber && (
        <MenuBrowseScreen tableNumber={tableNumber} onCheckout={handleCheckout} />
      )}
      {currentScreen === "order-checkout" && tableNumber && (
        <OrderCheckoutScreen 
          tableNumber={tableNumber} 
          cart={cart}
          onOrderConfirmed={handleOrderConfirmed}
          onBack={handleBackToMenu}
        />
      )}
      {currentScreen === "order-confirmation" && orderData && (
        <OrderConfirmationScreen
          orderId={orderData.orderId}
          tableNumber={orderData.tableNumber}
          customerName={orderData.customerName}
          total={orderData.total}
          onBackToMenu={handleNewOrder}
          onViewStatus={handleViewStatus}
        />
      )}
      {currentScreen === "order-tracking" && orderData && (
        <OrderTrackingScreen
          orderId={orderData.orderId}
          tableNumber={orderData.tableNumber}
          customerName={orderData.customerName}
        />
      )}
    </div>
  )
}
