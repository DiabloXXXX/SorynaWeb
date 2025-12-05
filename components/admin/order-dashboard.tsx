"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, ChefHat, Loader2, RefreshCw, XCircle, Wifi, WifiOff } from "lucide-react"
import { 
  getAllOrders, 
  updateOrderStatus as updateOrderStatusAPI,
  getStatusLabel,
  getTimeElapsed,
  type Order 
} from "@/lib/orderService"
import { formatPrice } from "@/lib/menuService"
import { useToast } from "@/hooks/use-toast"

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
    bgColor: "bg-yellow-50",
  },
  preparing: {
    label: "Preparing",
    color: "bg-blue-100 text-blue-700",
    icon: ChefHat,
    bgColor: "bg-blue-50",
  },
  ready: {
    label: "Ready",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
    bgColor: "bg-green-50",
  },
  completed: {
    label: "Completed",
    color: "bg-gray-100 text-gray-700",
    icon: CheckCircle,
    bgColor: "bg-gray-50",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
    bgColor: "bg-red-50",
  },
}

// Refresh interval in milliseconds (5 seconds for realtime feel)
const REFRESH_INTERVAL = 5000

export function OrderDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedTab, setSelectedTab] = useState<Order["status"]>("pending")
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const { toast } = useToast()

  const loadOrders = useCallback(async (showRefreshIndicator = false) => {
    // Only show full loading on first load
    if (!initialLoadDone) setLoading(true)
    if (showRefreshIndicator) setRefreshing(true)

    try {
      const result = await getAllOrders()
      
      if (result.orders) {
        // Transform GAS response to match our Order type
        const transformedOrders: Order[] = result.orders.map((order: any) => ({
          orderId: order.orderId,
          table: order.table,
          customerName: order.customerName || 'Guest',
          status: order.status || 'pending',
          total: order.total || 0,
          timestamp: order.createdAt || order.timestamp || new Date().toISOString(),
          notes: order.notes || '',
          items: order.items || [],
          itemCount: order.itemCount || 0,
        }))
        
        setOrders(transformedOrders)
        setIsConnected(true)
        setLastUpdate(new Date())
        setInitialLoadDone(true)
      } else if (result.error) {
        console.error("Error loading orders:", result.error)
        setIsConnected(false)
      }
    } catch (error) {
      console.error("Error loading orders:", error)
      setIsConnected(false)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [initialLoadDone])

  useEffect(() => {
    loadOrders()
    // Auto-refresh every 10 seconds for realtime updates
    const interval = setInterval(() => loadOrders(true), REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [loadOrders])

  const filteredOrders = orders.filter((order) => order.status === selectedTab)

  const updateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    setUpdatingOrder(orderId)
    
    try {
      const result = await updateOrderStatusAPI(orderId, newStatus)
      if (result.success) {
        // Update locally first for instant feedback
        setOrders(orders.map(order => 
          order.orderId === orderId ? { ...order, status: newStatus } : order
        ))
        toast({
          title: "Status Updated",
          description: `Order ${orderId} marked as ${getStatusLabel(newStatus)}`,
        })
        // Then refresh from server
        loadOrders(true)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update order status",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setUpdatingOrder(null)
    }
  }

  const getNextStatus = (currentStatus: Order["status"]): Order["status"] | null => {
    const statusFlow: Record<string, Order["status"]> = {
      pending: "preparing",
      preparing: "ready",
      ready: "completed",
    }
    return statusFlow[currentStatus] || null
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Memuat pesanan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Connection Status Banner */}
      {!isConnected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="h-5 w-5 text-red-600" />
            <span className="text-red-800">
              Tidak dapat terhubung ke server. Pastikan Google Apps Script sudah di-deploy.
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadOrders(true)}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Order Dashboard</h2>
          {isConnected && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Wifi className="h-4 w-4" />
              <span>Live</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Update: {lastUpdate.toLocaleTimeString('id-ID')}
            </span>
          )}
          <Button
            variant="outline"
            onClick={() => loadOrders(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const StatusIcon = config.icon
          const count = orders.filter((o) => o.status === status).length
          return (
            <Card key={status} className={`p-4 ${config.bgColor} cursor-pointer transition-transform hover:scale-105`} onClick={() => setSelectedTab(status as Order["status"])}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{config.label}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <StatusIcon className={`h-8 w-8 opacity-50`} />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto pb-1">
        {Object.entries(statusConfig).map(([status, config]) => (
          <Button
            key={status}
            variant={selectedTab === status ? "default" : "ghost"}
            onClick={() => setSelectedTab(status as Order["status"])}
            className={`whitespace-nowrap ${selectedTab === status ? "border-b-2" : ""}`}
          >
            {config.label}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-background/50 text-xs">
              {orders.filter((o) => o.status === status).length}
            </span>
          </Button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Tidak ada order dengan status {statusConfig[selectedTab]?.label || selectedTab}</p>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.pending
            const StatusIcon = config.icon
            const nextStatus = getNextStatus(order.status)
            return (
              <Card key={order.orderId} className={`p-6 border-2 ${
                order.status === 'pending' ? 'border-yellow-300' :
                order.status === 'preparing' ? 'border-blue-300' :
                order.status === 'ready' ? 'border-green-300' :
                'border-gray-200'
              } ${config.bgColor}`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Order Info */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Order ID</p>
                        <p className="text-xl font-bold text-primary font-mono">{order.orderId}</p>
                      </div>
                      <Badge className={`${config.color} text-sm px-3 py-1`}>
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {config.label}
                      </Badge>
                    </div>
                    
                    <div className="bg-white/50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Meja</span>
                        <span className="text-lg font-bold bg-primary text-primary-foreground px-3 py-1 rounded">#{order.table}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Nama</span>
                        <span className="font-semibold">{order.customerName || "Guest"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Waktu</span>
                        <span className="text-sm">{getTimeElapsed(order.timestamp)}</span>
                      </div>
                    </div>
                    
                    {order.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs text-yellow-700 uppercase tracking-wide mb-1">📝 Catatan</p>
                        <p className="text-sm font-medium text-yellow-800">{order.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Order Items - IMPROVED */}
                  <div className="lg:col-span-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">🛒 Detail Pesanan</p>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="divide-y divide-gray-100">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div key={idx} className="p-3 hover:bg-gray-50 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">{item.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {item.quantity}x @ {formatPrice(item.price)}
                                  </p>
                                </div>
                                <span className="font-bold text-primary ml-2">
                                  {formatPrice(item.price * item.quantity)}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-muted-foreground text-sm">
                            {(order as any).itemCount ? `${(order as any).itemCount} item(s)` : 'Detail tidak tersedia'}
                          </div>
                        )}
                      </div>
                      
                      {/* Total */}
                      <div className="bg-primary/10 p-3 border-t-2 border-primary">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">TOTAL</span>
                          <span className="font-bold text-xl text-primary">{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col justify-center gap-3">
                    {nextStatus && order.status !== "completed" && order.status !== "cancelled" && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.orderId, nextStatus)}
                          disabled={updatingOrder === order.orderId}
                          size="lg"
                          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-lg font-bold"
                        >
                          {updatingOrder === order.orderId ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              {nextStatus === 'preparing' && <ChefHat className="h-5 w-5 mr-2" />}
                              {nextStatus === 'ready' && <CheckCircle className="h-5 w-5 mr-2" />}
                              {nextStatus === 'completed' && <CheckCircle className="h-5 w-5 mr-2" />}
                              {statusConfig[nextStatus]?.label || nextStatus}
                            </>
                          )}
                        </Button>
                        {order.status === 'pending' && (
                          <Button
                            variant="destructive"
                            onClick={() => updateOrderStatus(order.orderId, 'cancelled')}
                            disabled={updatingOrder === order.orderId}
                            className="w-full"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Batalkan
                          </Button>
                        )}
                      </>
                    )}
                    {order.status === "completed" && (
                      <div className="flex items-center justify-center p-4 bg-green-100 rounded-lg border-2 border-green-300">
                        <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                        <span className="font-bold text-green-700">Selesai ✓</span>
                      </div>
                    )}
                    {order.status === "cancelled" && (
                      <div className="flex items-center justify-center p-4 bg-red-100 rounded-lg border-2 border-red-300">
                        <XCircle className="h-6 w-6 text-red-600 mr-2" />
                        <span className="font-bold text-red-700">Dibatalkan</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
