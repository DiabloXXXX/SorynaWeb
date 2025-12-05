"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ChefHat, CheckCircle, AlertCircle } from "lucide-react"

interface OrderItem {
  menuName: string
  quantity: number
  price: number
}

interface OrderTrackingScreenProps {
  orderId: string
  tableNumber: string
  customerName: string
}

const statusConfig = {
  pending: {
    label: "Pesanan Diterima",
    description: "Pesanan Anda sedang di antri di kitchen",
    icon: AlertCircle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200",
    estimatedTime: "5-10 menit",
  },
  preparing: {
    label: "Sedang Disiapkan",
    description: "Kitchen sedang membuat pesanan Anda",
    icon: ChefHat,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    estimatedTime: "3-5 menit",
  },
  ready: {
    label: "Siap Diambil",
    description: "Pesanan Anda siap! Silakan ambil di counter",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50 border-green-200",
    estimatedTime: "Sekarang",
  },
  completed: {
    label: "Selesai",
    description: "Terima kasih telah memesan di Hapiyo Coffee",
    icon: CheckCircle,
    color: "text-gray-600",
    bgColor: "bg-gray-50 border-gray-200",
    estimatedTime: "-",
  },
}

// Mock order data - akan diganti dengan API call ke backend
const MOCK_ORDER = {
  orderId: "ORD1733357400000",
  tableNumber: "5",
  customerName: "John Doe",
  items: [
    { menuName: "Hapiyo Latte", quantity: 2, price: 25000 },
    { menuName: "Croissant", quantity: 1, price: 25000 },
  ],
  total: 75000,
  status: "preparing" as const,
  timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
}

export function OrderTrackingScreen({ orderId, tableNumber, customerName }: OrderTrackingScreenProps) {
  const [order, setOrder] = useState(MOCK_ORDER)
  const [timeElapsed, setTimeElapsed] = useState(0)

  // Simulate real-time status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const statusSteps = ["pending", "preparing", "ready", "completed"] as const
  const currentStepIndex = statusSteps.indexOf(order.status)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const CurrentStatusIcon = statusConfig[order.status].icon

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-card border-b border-border p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-primary">Status Pesanan</h1>
        <p className="text-sm text-muted-foreground">Order ID: {order.orderId}</p>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Current Status Card */}
        <Card className={`p-6 border-2 ${statusConfig[order.status].bgColor}`}>
          <div className="flex items-start gap-4">
            <div className={`mt-1 p-3 rounded-full ${statusConfig[order.status].bgColor}`}>
              <CurrentStatusIcon className={`w-8 h-8 ${statusConfig[order.status].color}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-xl font-bold ${statusConfig[order.status].color} mb-1`}>
                {statusConfig[order.status].label}
              </h2>
              <p className="text-sm text-muted-foreground mb-3">{statusConfig[order.status].description}</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Waktu elapsed: {formatTime(timeElapsed)}</span>
                </div>
                <Badge variant="outline">Est. {statusConfig[order.status].estimatedTime}</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Status Timeline */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-6">Progres Pesanan</h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-1 bg-border"></div>

            {/* Timeline items */}
            <div className="space-y-6">
              {statusSteps.map((step, index) => {
                const isActive = index <= currentStepIndex
                const StepIcon = statusConfig[step].icon
                return (
                  <div key={step} className="relative pl-20">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                        isActive
                          ? `bg-primary border-primary text-primary-foreground`
                          : `bg-muted border-border text-muted-foreground`
                      }`}
                    >
                      <StepIcon className="w-6 h-6" />
                    </div>

                    {/* Timeline content */}
                    <div className={isActive ? "opacity-100" : "opacity-50"}>
                      <p className="font-semibold text-foreground">{statusConfig[step].label}</p>
                      <p className="text-sm text-muted-foreground">{statusConfig[step].description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        {/* Order Details */}
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Detail Pesanan</h3>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center pb-3 border-b border-border last:border-0">
                <div>
                  <p className="font-medium">{item.menuName}</p>
                  <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                </div>
                <p className="font-semibold">Rp {(item.price * item.quantity).toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">Rp {order.total.toLocaleString()}</span>
          </div>
        </Card>

        {/* Order Info */}
        <Card className="p-6 bg-muted">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nomor Meja</p>
              <p className="font-bold text-lg">#{order.tableNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nama Customer</p>
              <p className="font-bold text-lg">{order.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Waktu Order</p>
              <p className="font-bold">{new Date(order.timestamp).toLocaleTimeString("id-ID")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Order ID</p>
              <p className="font-bold font-mono text-primary">{order.orderId}</p>
            </div>
          </div>
        </Card>

        {/* Help Section */}
        {order.status === "ready" && (
          <Card className="p-4 bg-green-50 border-green-200 border-2">
            <p className="text-center font-semibold text-green-700">
              Pesanan Anda sudah siap! Silakan ambil di counter. Terima kasih!
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
