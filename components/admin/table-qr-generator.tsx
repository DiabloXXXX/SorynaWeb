'use client';

import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  Printer, 
  QrCode, 
  Table2, 
  Plus, 
  Minus,
  FileDown,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface TableQRProps {
  baseUrl?: string;
  shopName?: string;
}

export function TableQRGenerator({ 
  baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hapiyo.vercel.app',
  shopName = process.env.NEXT_PUBLIC_SHOP_NAME || 'Hapiyo Coffee'
}: TableQRProps) {
  const [tableCount, setTableCount] = useState(10);
  const [startNumber, setStartNumber] = useState(1);
  const [selectedTables, setSelectedTables] = useState<number[]>([]);
  const [qrSize, setQrSize] = useState(200);
  const printRef = useRef<HTMLDivElement>(null);

  // Generate URL for table
  const getTableUrl = (tableNumber: number) => {
    return `${baseUrl}/?table=${tableNumber}`;
  };

  // Toggle table selection
  const toggleTable = (tableNumber: number) => {
    setSelectedTables(prev => 
      prev.includes(tableNumber) 
        ? prev.filter(t => t !== tableNumber)
        : [...prev, tableNumber]
    );
  };

  // Select all tables
  const selectAll = () => {
    const allTables = Array.from({ length: tableCount }, (_, i) => startNumber + i);
    setSelectedTables(allTables);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedTables([]);
  };

  // Download single QR as PNG
  const downloadQR = async (tableNumber: number) => {
    const svg = document.getElementById(`qr-${tableNumber}`);
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new window.Image();
    
    // Add padding for label
    const padding = 60;
    canvas.width = qrSize + 40;
    canvas.height = qrSize + padding + 40;

    img.onload = () => {
      if (!ctx) return;
      
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw QR code
      ctx.drawImage(img, 20, 20, qrSize, qrSize);
      
      // Draw table number
      ctx.fillStyle = 'black';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Meja ${tableNumber}`, canvas.width / 2, qrSize + 50);
      
      // Draw shop name
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666';
      ctx.fillText(shopName, canvas.width / 2, qrSize + 70);

      // Download
      const link = document.createElement('a');
      link.download = `meja-${tableNumber}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success(`QR Meja ${tableNumber} berhasil didownload`);
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Download all selected as ZIP (or individual files)
  const downloadSelected = async () => {
    if (selectedTables.length === 0) {
      toast.error('Pilih meja terlebih dahulu');
      return;
    }

    toast.info(`Mengunduh ${selectedTables.length} QR code...`);
    
    // Download each with slight delay to prevent browser blocking
    for (let i = 0; i < selectedTables.length; i++) {
      setTimeout(() => {
        downloadQR(selectedTables[i]);
      }, i * 300);
    }
  };

  // Print selected QR codes
  const printSelected = () => {
    if (selectedTables.length === 0) {
      toast.error('Pilih meja terlebih dahulu');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Izinkan popup untuk print.');
      return;
    }

    const qrElements = selectedTables.map(tableNum => {
      const svg = document.getElementById(`qr-${tableNum}`);
      if (!svg) return '';
      const svgData = new XMLSerializer().serializeToString(svg);
      const base64 = btoa(unescape(encodeURIComponent(svgData)));
      
      return `
        <div class="qr-card">
          <img src="data:image/svg+xml;base64,${base64}" width="${qrSize}" height="${qrSize}" />
          <h2>Meja ${tableNum}</h2>
          <p>${shopName}</p>
          <p class="url">${getTableUrl(tableNum)}</p>
          <p class="instruction">Scan untuk pesan</p>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code Meja - ${shopName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px;
          }
          .container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
          }
          .qr-card {
            border: 2px solid #333;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            page-break-inside: avoid;
            background: white;
          }
          .qr-card img {
            display: block;
            margin: 0 auto 15px;
          }
          .qr-card h2 {
            font-size: 28px;
            margin-bottom: 5px;
            color: #1a1a2e;
          }
          .qr-card p {
            color: #666;
            font-size: 14px;
          }
          .qr-card .url {
            font-size: 10px;
            color: #999;
            margin-top: 10px;
            word-break: break-all;
          }
          .qr-card .instruction {
            margin-top: 10px;
            font-weight: bold;
            color: #e94560;
          }
          @media print {
            .qr-card { 
              border: 2px solid #333; 
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${qrElements}
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  // Generate PDF-ready view
  const generatePrintableSheet = () => {
    if (selectedTables.length === 0) {
      toast.error('Pilih meja terlebih dahulu');
      return;
    }
    printSelected();
  };

  const tables = Array.from({ length: tableCount }, (_, i) => startNumber + i);

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Generator QR Code Meja
          </CardTitle>
          <CardDescription>
            Generate QR code untuk setiap meja. Pelanggan scan → langsung order di meja tersebut.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tableCount">Jumlah Meja</Label>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setTableCount(Math.max(1, tableCount - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="tableCount"
                  type="number"
                  value={tableCount}
                  onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="text-center"
                  min={1}
                  max={100}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setTableCount(Math.min(100, tableCount + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startNumber">Mulai dari Nomor</Label>
              <Input
                id="startNumber"
                type="number"
                value={startNumber}
                onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qrSize">Ukuran QR (px)</Label>
              <Input
                id="qrSize"
                type="number"
                value={qrSize}
                onChange={(e) => setQrSize(Math.max(100, Math.min(400, parseInt(e.target.value) || 200)))}
                min={100}
                max={400}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              URL otomatis dari environment. Format: {baseUrl}/?table=1
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={selectAll} variant="outline" size="sm">
              <Table2 className="h-4 w-4 mr-2" />
              Pilih Semua ({tableCount})
            </Button>
            <Button onClick={clearSelection} variant="outline" size="sm">
              Clear Selection
            </Button>
            <div className="flex-1" />
            <Button 
              onClick={downloadSelected} 
              disabled={selectedTables.length === 0}
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download ({selectedTables.length})
            </Button>
            <Button 
              onClick={printSelected} 
              disabled={selectedTables.length === 0}
              variant="secondary"
              size="sm"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" ref={printRef}>
        {tables.map((tableNum) => (
          <Card 
            key={tableNum}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedTables.includes(tableNum) 
                ? 'ring-2 ring-primary bg-primary/5' 
                : ''
            }`}
            onClick={() => toggleTable(tableNum)}
          >
            <CardContent className="p-4 text-center">
              <div className="bg-white p-3 rounded-lg inline-block mb-3">
                <QRCodeSVG
                  id={`qr-${tableNum}`}
                  value={getTableUrl(tableNum)}
                  size={qrSize > 150 ? 150 : qrSize}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <h3 className="font-bold text-lg">Meja {tableNum}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {getTableUrl(tableNum)}
              </p>
              <div className="flex gap-2 mt-3 justify-center">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadQR(tableNum);
                  }}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(getTableUrl(tableNum));
                    toast.success(`URL Meja ${tableNum} disalin`);
                  }}
                >
                  <FileDown className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📱 Cara Penggunaan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <p><strong>Download/Print</strong> QR code untuk setiap meja</p>
          </div>
          <div className="flex gap-3">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <p><strong>Tempel</strong> QR code di meja (laminasi untuk tahan lama)</p>
          </div>
          <div className="flex gap-3">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <p><strong>Pelanggan scan</strong> pakai Google Lens / Kamera HP → otomatis buka halaman order</p>
          </div>
          <div className="flex gap-3">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <p><strong>Fallback:</strong> Jika Google Lens tidak bisa, pelanggan buka web → scan QR dari dalam app</p>
          </div>
          
          <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg mt-4">
            <p className="text-amber-800 dark:text-amber-200">
              <strong>💡 Tips:</strong> Gunakan level koreksi error "H" (High) agar QR tetap terbaca meski sedikit rusak/kotor.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
