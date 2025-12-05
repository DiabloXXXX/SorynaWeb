"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, DollarSign, CreditCard, Loader2, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { getOrderStats, getAllOrders, type OrderStats, type Order } from "@/lib/orderService"

// Refresh interval (5 seconds for more realtime feel)
const REFRESH_INTERVAL = 5000

export function FinanceDashboard() {
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  const loadData = useCallback(async (showRefreshIndicator = false) => {
    // Only show full loading on first load
    if (!initialLoadDone) setLoading(true)
    if (showRefreshIndicator) setRefreshing(true)

    try {
      const [statsResult, ordersResult] = await Promise.all([
        getOrderStats(),
        getAllOrders()
      ])

      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats)
        setIsConnected(true)
      }

      if (ordersResult.orders) {
        setOrders(ordersResult.orders)
      }

      setLastUpdate(new Date())
      setInitialLoadDone(true)
    } catch (error) {
      console.error("Error loading finance data:", error)
      setIsConnected(false)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [initialLoadDone])

  useEffect(() => {
    loadData()
    const interval = setInterval(() => loadData(true), REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [loadData])

  // Calculate metrics from real data
  const metrics = {
    totalRevenue: stats?.totalRevenue || 0,
    todayRevenue: stats?.todayRevenue || 0,
    totalOrders: stats?.totalOrders || 0,
    todayOrders: stats?.todayOrders || 0,
    completedOrders: stats?.completedOrders || 0,
    pendingOrders: stats?.pendingOrders || 0,
    avgOrderValue: stats?.completedOrders ? Math.round((stats.totalRevenue || 0) / stats.completedOrders) : 0,
  }

  // Filter completed orders for transaction list
  const completedOrders = orders.filter(o => o.status === 'completed')

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Memuat data keuangan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WifiOff className="h-5 w-5 text-red-600" />
            <span className="text-red-800">Tidak dapat terhubung ke server</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => loadData(true)}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Finance Analytics</h2>
          {isConnected && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Wifi className="h-4 w-4" />
              <span>Live</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Update: {lastUpdate.toLocaleTimeString('id-ID')}
            </span>
          )}
          <Button
            variant="outline"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
            <DollarSign className="h-4 w-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold">Rp {metrics.totalRevenue.toLocaleString('id-ID')}</p>
          <p className="text-xs text-muted-foreground mt-2">{metrics.completedOrders} pesanan selesai</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Hari Ini</p>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold">Rp {metrics.todayRevenue.toLocaleString('id-ID')}</p>
          <p className="text-xs text-muted-foreground mt-2">{metrics.todayOrders} pesanan hari ini</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Rata-rata Order</p>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-3xl font-bold">Rp {metrics.avgOrderValue.toLocaleString('id-ID')}</p>
          <p className="text-xs text-muted-foreground mt-2">per transaksi</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Pesanan</p>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold">{metrics.totalOrders}</p>
          <p className="text-xs text-muted-foreground mt-2">{metrics.pendingOrders} masih pending</p>
        </Card>
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Status Pesanan</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Pending</span>
              <span className="font-semibold text-yellow-600">{stats?.pendingOrders || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Preparing</span>
              <span className="font-semibold text-blue-600">{stats?.preparingOrders || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Ready</span>
              <span className="font-semibold text-green-600">{stats?.readyOrders || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Completed</span>
              <span className="font-semibold text-gray-600">{stats?.completedOrders || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Cancelled</span>
              <span className="font-semibold text-red-600">{stats?.cancelledOrders || 0}</span>
            </div>
          </div>
        </Card>

        {/* Recent Completed Orders */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Transaksi Terakhir</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {completedOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm">Belum ada transaksi selesai</p>
            ) : (
              completedOrders.slice(0, 10).map((order: Order) => (
                <div key={order.orderId} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <div>
                    <p className="font-mono text-sm font-semibold">{order.orderId}</p>
                    <p className="text-xs text-muted-foreground">Meja {order.table}</p>
                  </div>
                  <span className="font-semibold text-green-600">
                    +Rp {(order.total || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Google Sheets Sync Info */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-900">
          ✓ Data otomatis tersinkronisasi dengan Google Sheets. Semua pesanan tercatat di spreadsheet untuk analisis lebih lanjut.
        </p>
      </Card>
    </div>
  )
}
