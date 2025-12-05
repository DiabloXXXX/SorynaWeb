"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { MenuManagementDashboard } from "@/components/admin/menu-management-dashboard"
import { OrderDashboard } from "@/components/admin/order-dashboard"
import { FinanceDashboard } from "@/components/admin/finance-dashboard"
import { TableQRGenerator } from "@/components/admin/table-qr-generator"

type AdminTab = "menu" | "orders" | "qr" | "finance"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("menu")

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "menu" && <MenuManagementDashboard />}
      {activeTab === "orders" && <OrderDashboard />}
      {activeTab === "qr" && (
        <div className="p-6">
          <TableQRGenerator />
        </div>
      )}
      {activeTab === "finance" && <FinanceDashboard />}
    </AdminLayout>
  )
}
