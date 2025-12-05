"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Loader2 } from "lucide-react"
import { getCategories, type MenuItem } from "@/lib/menuService"

interface MenuFormProps {
  menu?: MenuItem | null
  onSubmit: (data: MenuItem) => void
  onClose: () => void
}

const DEFAULT_CATEGORIES = ["coffee", "non-coffee", "snacks", "meals"]

export function MenuForm({ menu, onSubmit, onClose }: MenuFormProps) {
  const [formData, setFormData] = useState<Omit<MenuItem, "id">>({
    name: menu?.name || "",
    category: menu?.category || "coffee",
    price: menu?.price || 0,
    description: menu?.description || "",
    stock: menu?.stock || 0,
    available: menu?.available ?? true,
    image: menu?.image || "",
  })
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [showNewCategory, setShowNewCategory] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const result = await getCategories()
      if (result.success && result.categories) {
        const catNames = result.categories.map(c => c.name)
        setCategories(catNames.length > 0 ? catNames : DEFAULT_CATEGORIES)
      }
    } catch (error) {
      console.error("Error loading categories:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.category) {
      alert("Nama dan kategori harus diisi")
      return
    }

    setLoading(true)
    
    const finalCategory = showNewCategory && newCategory.trim() 
      ? newCategory.trim().toLowerCase() 
      : formData.category

    onSubmit({
      id: menu?.id || `${finalCategory}_${Date.now()}`,
      ...formData,
      category: finalCategory,
    })
    
    setLoading(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
            <h2 className="text-xl font-bold">{menu ? "Edit Menu" : "Tambah Menu Baru"}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nama Menu *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Hapiyo Latte"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Kategori *</label>
              {!showNewCategory ? (
                <div className="space-y-2">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs"
                    onClick={() => setShowNewCategory(true)}
                  >
                    + Tambah Kategori Baru
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Nama kategori baru"
                  />
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs"
                    onClick={() => setShowNewCategory(false)}
                  >
                    ← Pilih dari yang ada
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Deskripsi</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi singkat menu..."
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground min-h-[80px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Harga (Rp) *</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number.parseInt(e.target.value) || 0 })}
                  placeholder="25000"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stok *</label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number.parseInt(e.target.value) || 0 })}
                  placeholder="50"
                  min="0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">URL Gambar</label>
              <Input
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://images.unsplash.com/..."
              />
              {formData.image && (
                <div className="mt-2">
                  <img 
                    src={formData.image} 
                    alt="Preview" 
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg"
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="available"
                checked={formData.available}
                onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                className="rounded border-input"
              />
              <label htmlFor="available" className="text-sm font-medium cursor-pointer">
                Menu tersedia
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Batal
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  menu ? "Update" : "Tambah"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  )
}
