"use client"

import type React from "react"

import { Menu, Package, ShoppingCart, BarChart3, LogOut, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface AdminLayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems = [
  { id: "menu", label: "Menu Management", icon: Package },
  { id: "orders", label: "Order Tracking", icon: ShoppingCart },
  { id: "qr", label: "QR Meja", icon: QrCode },
  { id: "finance", label: "Finance Analytics", icon: BarChart3 },
]

export function AdminLayout({ children, activeTab, onTabChange }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-card border-r border-border transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">HC</span>
                </div>
                <span className="font-bold text-sm">Hapiyo Admin</span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="h-8 w-8">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={`w-full justify-start ${!sidebarOpen && "px-0"}`}
              onClick={() => onTabChange(item.id)}
            >
              <item.icon className={`h-4 w-4 ${sidebarOpen ? "mr-3" : ""}`} />
              {sidebarOpen && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className={`w-full justify-start text-destructive ${!sidebarOpen && "px-0"}`}>
            <LogOut className={`h-4 w-4 ${sidebarOpen ? "mr-3" : ""}`} />
            {sidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Hapiyo Coffee Admin</h1>
          <div className="text-sm text-muted-foreground">Welcome back, Admin</div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  )
}
