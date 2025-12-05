"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Plus, Edit2, Trash2, Search, RefreshCw, Loader2, Database } from "lucide-react"
import { MenuForm } from "./menu-form"
import { 
  getAllMenus, 
  createMenu, 
  updateMenu, 
  deleteMenu,
  formatPrice,
  type MenuItem 
} from "@/lib/menuService"
import { useToast } from "@/hooks/use-toast"

export function MenuManagementDashboard() {
  const [menus, setMenus] = useState<MenuItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const { toast } = useToast()

  // Load menus from API
  const loadMenus = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    else setLoading(true)
    
    try {
      const result = await getAllMenus()
      if (result.success && result.menus) {
        setMenus(result.menus)
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal memuat menu",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading menus:", error)
      toast({
        title: "Error",
        description: "Gagal terhubung ke server",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [toast])

  useEffect(() => {
    loadMenus()
  }, [loadMenus])

  const filteredMenus = menus.filter(
    (menu) =>
      menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      menu.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddMenu = async (data: MenuItem) => {
    try {
      if (selectedMenu) {
        // Update existing menu
        const result = await updateMenu(selectedMenu.id, data)
        if (result.success) {
          toast({
            title: "Berhasil",
            description: `Menu "${data.name}" berhasil diupdate`,
          })
          loadMenus(true)
        } else {
          toast({
            title: "Error",
            description: result.error || "Gagal mengupdate menu",
            variant: "destructive",
          })
        }
      } else {
        // Create new menu
        const result = await createMenu(data)
        if (result.success) {
          toast({
            title: "Berhasil",
            description: `Menu "${data.name}" berhasil ditambahkan`,
          })
          loadMenus(true)
        } else {
          toast({
            title: "Error",
            description: result.error || "Gagal menambahkan menu",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error saving menu:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan menu",
        variant: "destructive",
      })
    }
    
    setShowForm(false)
    setSelectedMenu(null)
  }

  const handleEdit = (menu: MenuItem) => {
    setSelectedMenu(menu)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    const menu = menus.find(m => m.id === id)
    if (!confirm(`Hapus menu "${menu?.name}"?`)) return

    try {
      const result = await deleteMenu(id)
      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Menu berhasil dihapus",
        })
        loadMenus(true)
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal menghapus menu",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting menu:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus menu",
        variant: "destructive",
      })
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedMenu(null)
  }

  const handleSeedData = async () => {
    if (!confirm("Ini akan menghapus semua data menu dan menggantinya dengan data contoh. Lanjutkan?")) {
      return
    }

    setSeeding(true)
    try {
      const response = await fetch("/api/seed", { method: "POST" })
      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Berhasil",
          description: `${result.itemsAdded} menu berhasil ditambahkan`,
        })
        loadMenus(true)
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal seed data",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error seeding data:", error)
      toast({
        title: "Error",
        description: "Gagal seed data menu",
        variant: "destructive",
      })
    } finally {
      setSeeding(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Memuat menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => loadMenus(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {menus.length === 0 && (
            <Button
              variant="outline"
              onClick={handleSeedData}
              disabled={seeding}
              className="gap-2"
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Seed Data</span>
            </Button>
          )}
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah Menu
          </Button>
        </div>
      </div>

      {/* Menu Form Modal */}
      {showForm && <MenuForm menu={selectedMenu} onSubmit={handleAddMenu} onClose={handleCloseForm} />}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Menu</p>
          <p className="text-2xl font-bold">{menus.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Tersedia</p>
          <p className="text-2xl font-bold text-green-600">{menus.filter((m) => m.available).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Tidak Tersedia</p>
          <p className="text-2xl font-bold text-red-600">{menus.filter((m) => !m.available).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Kategori</p>
          <p className="text-2xl font-bold">{new Set(menus.map((m) => m.category)).size}</p>
        </Card>
      </div>

      {/* Empty State */}
      {menus.length === 0 && (
        <Card className="p-12 text-center">
          <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Belum Ada Menu</h3>
          <p className="text-muted-foreground mb-4">
            Tambahkan menu pertama Anda atau gunakan data contoh
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={handleSeedData} disabled={seeding}>
              {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Gunakan Data Contoh
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Manual
            </Button>
          </div>
        </Card>
      )}

      {/* Menu Table */}
      {menus.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Nama Menu</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Kategori</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Harga</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Stok</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMenus.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Tidak ada menu ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredMenus.map((menu) => (
                    <tr key={menu.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={menu.image || "/placeholder.svg"}
                            alt={menu.name}
                            className="w-10 h-10 rounded-lg object-cover bg-muted"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/placeholder.svg"
                            }}
                          />
                          <div>
                            <div className="font-medium">{menu.name}</div>
                            {menu.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {menu.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded bg-muted text-sm capitalize">
                          {menu.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-primary">
                        {formatPrice(menu.price)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            menu.stock > 10 
                              ? "bg-green-100 text-green-700" 
                              : menu.stock > 0 
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {menu.stock} unit
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            menu.available ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {menu.available ? "Tersedia" : "Habis"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(menu)} className="h-8 w-8 p-0">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(menu.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
