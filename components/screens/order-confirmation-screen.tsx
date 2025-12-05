"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Eye, Home } from "lucide-react"

interface OrderConfirmationScreenProps {
  orderId: string
  tableNumber: string
  customerName: string
  total: number
  onBackToMenu: () => void
  onViewStatus: () => void
}

export function OrderConfirmationScreen({
  orderId,
  tableNumber,
  customerName,
  total,
  onBackToMenu,
  onViewStatus,
}: OrderConfirmationScreenProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 mx-auto">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Pesanan Diterima!</h2>
          <p className="text-muted-foreground text-center mb-6">Pesanan Anda sedang disiapkan</p>

          {/* Order Summary */}
          <div className="bg-muted p-4 rounded-lg mb-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Order ID</p>
              <p className="text-lg font-bold text-primary font-mono">{orderId}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Nomor Meja</p>
                <p className="font-semibold">#{tableNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Atas Nama</p>
                <p className="font-semibold">{customerName}</p>
              </div>
            </div>
            <div className="border-t border-border pt-2">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-lg font-bold text-primary">Rp {total.toLocaleString()}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Kami akan memberitahu Anda saat pesanan siap untuk diambil
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={onViewStatus}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 font-bold"
          >
            <Eye className="w-4 h-4 mr-2" />
            Lihat Status Pesanan
          </Button>
          <Button onClick={onBackToMenu} variant="outline" className="w-full h-12 font-semibold bg-transparent">
            <Home className="w-4 h-4 mr-2" />
            Kembali ke Menu
          </Button>
        </div>
      </Card>
    </div>
  )
}
