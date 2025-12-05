"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Camera, QrCode, AlertCircle, RefreshCw } from "lucide-react"

interface QRScanScreenProps {
  onTableIdentified: (tableNumber: string) => void
}

export function QRScanScreen({ onTableIdentified }: QRScanScreenProps) {
  const [manualTable, setManualTable] = useState("")
  const [error, setError] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState("")
  const [hasCamera, setHasCamera] = useState(true)
  const scannerRef = useRef<any>(null)
  const isScannerRunning = useRef<boolean>(false)
  const isProcessingResult = useRef<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Safely stop scanner
  const stopScanner = async () => {
    if (scannerRef.current && isScannerRunning.current) {
      try {
        isScannerRunning.current = false
        await scannerRef.current.stop()
      } catch (e) {
        // Ignore stop errors
      }
    }
  }

  // Initialize QR Scanner
  const startScanning = async () => {
    setScanError("")
    setIsScanning(true)
    isProcessingResult.current = false

    try {
      // Dynamic import to avoid SSR issues
      const { Html5Qrcode } = await import("html5-qrcode")
      
      // Stop existing scanner first
      await stopScanner()

      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Prevent multiple calls
          if (isProcessingResult.current) return
          isProcessingResult.current = true
          
          // Successfully scanned
          handleQRResult(decodedText)
        },
        (errorMessage) => {
          // Scan error (ignore, keep scanning)
        }
      )
      
      isScannerRunning.current = true
    } catch (err: any) {
      console.error("Camera error:", err)
      setIsScanning(false)
      setHasCamera(false)
      isScannerRunning.current = false
      
      if (err.toString().includes("NotAllowedError")) {
        setScanError("Izin kamera ditolak. Silakan izinkan akses kamera.")
      } else if (err.toString().includes("NotFoundError")) {
        setScanError("Kamera tidak ditemukan di perangkat ini.")
      } else {
        setScanError("Gagal mengakses kamera. Gunakan input manual.")
      }
    }
  }

  // Handle QR Code result
  const handleQRResult = async (decodedText: string) => {
    // Stop scanner first
    await stopScanner()
    setIsScanning(false)

    // Parse the URL to extract table number
    // Expected format: https://domain.com/?table=5 or just "5"
    let tableNumber = ""
    
    try {
      if (decodedText.includes("table=")) {
        const url = new URL(decodedText)
        tableNumber = url.searchParams.get("table") || ""
      } else if (decodedText.includes("?table=")) {
        // Handle relative URL
        const match = decodedText.match(/[?&]table=(\d+)/)
        if (match) {
          tableNumber = match[1]
        }
      } else if (/^\d+$/.test(decodedText.trim())) {
        // Just a number
        tableNumber = decodedText.trim()
      }
    } catch {
      // If URL parsing fails, try to extract number
      const match = decodedText.match(/table[=:]?\s*(\d+)/i)
      if (match) {
        tableNumber = match[1]
      } else if (/^\d+$/.test(decodedText.trim())) {
        tableNumber = decodedText.trim()
      }
    }

    if (tableNumber) {
      onTableIdentified(tableNumber)
    } else {
      setScanError("QR Code tidak valid. Pastikan scan QR meja yang benar.")
      setIsScanning(false)
      isProcessingResult.current = false
    }
  }

  // Stop scanner on unmount
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  const handleManualEntry = () => {
    if (!manualTable.trim()) {
      setError("Masukkan nomor meja")
      return
    }
    
    const tableNum = manualTable.trim()
    if (!/^\d+$/.test(tableNum)) {
      setError("Nomor meja harus berupa angka")
      return
    }
    
    onTableIdentified(tableNum)
  }

  const retryCamera = () => {
    setScanError("")
    setHasCamera(true)
    startScanning()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-primary mb-2">Hapiyo</h1>
        <p className="text-muted-foreground text-lg">Coffee</p>
      </div>

      {/* Main Card */}
      <Card className="w-full max-w-md p-6 shadow-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <QrCode className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Scan QR Meja</h2>
          <p className="text-muted-foreground text-sm">
            Scan kode QR di meja Anda atau masukkan nomor meja manual
          </p>
        </div>

        {/* QR Scanner Area */}
        {hasCamera && (
          <div className="mb-6">
            {!isScanning ? (
              <div 
                className="bg-muted rounded-lg border-2 border-dashed border-primary/30 aspect-square flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={startScanning}
              >
                <div className="text-center p-4">
                  <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">Tap untuk Scan QR</p>
                  <p className="text-xs text-muted-foreground">Arahkan kamera ke QR code meja</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <div 
                  id="qr-reader" 
                  ref={containerRef}
                  className="rounded-lg overflow-hidden"
                  style={{ width: "100%" }}
                />
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="absolute top-2 right-2 z-10"
                  onClick={() => {
                    if (scannerRef.current) {
                      scannerRef.current.stop().catch(() => {})
                    }
                    setIsScanning(false)
                  }}
                >
                  Batal
                </Button>
              </div>
            )}

            {scanError && (
              <div className="mt-3 p-3 bg-destructive/10 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-destructive">{scanError}</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-primary"
                    onClick={retryCamera}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Coba lagi
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Entry */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">atau masukkan manual</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nomor Meja</label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Contoh: 5"
              value={manualTable}
              onChange={(e) => {
                setManualTable(e.target.value)
                setError("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleManualEntry()
                }
              }}
              className="text-center text-lg h-12"
            />
            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
          </div>

          <Button
            onClick={handleManualEntry}
            className="w-full h-12"
            disabled={!manualTable.trim()}
          >
            Lanjutkan ke Menu
          </Button>
        </div>
      </Card>

      {/* Footer Info */}
      <div className="text-center mt-6 space-y-2">
        <p className="text-muted-foreground text-sm">Pesan makanan & minuman dengan mudah</p>
        <p className="text-xs text-muted-foreground/70">
          💡 Tip: Scan langsung pakai Google Lens dari QR di meja
        </p>
      </div>
    </div>
  )
}
