"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  ClipboardList,
  MessageCircle,
  Package,
  ShoppingBag,
  Warehouse,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AdminMessagesPage } from "./AdminMessagesPage";
import { AdminOrdersPage } from "./AdminOrdersPage";
import { AdminProductsPage } from "./AdminProductsPage";

type AdminTab = "dashboard" | "products" | "orders" | "messages";

interface DashboardStats {
  products: number;
  activeProducts: number;
  lowStock: number;
  orders: number;
  pendingOrders: number;
  openConversations: number;
}

function AdminDashboard({ onNavigate }: { onNavigate: (tab: AdminTab) => void }) {
  const [stats, setStats] = useState<DashboardStats>({
    products: 0,
    activeProducts: 0,
    lowStock: 0,
    orders: 0,
    pendingOrders: 0,
    openConversations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");

      const [
        productsResult,
        activeProductsResult,
        lowStockResult,
        ordersResult,
        pendingOrdersResult,
        conversationsResult,
      ] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .lt("stock", 10),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
      ]);

      const failed = [
        productsResult.error,
        activeProductsResult.error,
        lowStockResult.error,
        ordersResult.error,
        pendingOrdersResult.error,
        conversationsResult.error,
      ].find(Boolean);

      if (failed) {
        setError("Không thể tải số liệu tổng quan.");
      } else {
        setStats({
          products: productsResult.count ?? 0,
          activeProducts: activeProductsResult.count ?? 0,
          lowStock: lowStockResult.count ?? 0,
          orders: ordersResult.count ?? 0,
          pendingOrders: pendingOrdersResult.count ?? 0,
          openConversations: conversationsResult.count ?? 0,
        });
      }

      setLoading(false);
    };

    fetchStats();
  }, []);

  const cards = [
    {
      label: "Tổng sản phẩm",
      value: stats.products,
      icon: Package,
      tone: "text-blue-600 bg-blue-50",
    },
    {
      label: "Đang hiển thị",
      value: stats.activeProducts,
      icon: ClipboardList,
      tone: "text-green-600 bg-green-50",
    },
    {
      label: "Sắp hết hàng",
      value: stats.lowStock,
      icon: Warehouse,
      tone: "text-orange-600 bg-orange-50",
    },
    {
      label: "Đơn chờ xử lý",
      value: stats.pendingOrders,
      icon: ShoppingBag,
      tone: "text-purple-600 bg-purple-50",
    },
    {
      label: "Chat đang mở",
      value: stats.openConversations,
      icon: MessageCircle,
      tone: "text-cyan-600 bg-cyan-50",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Tổng quan quản trị</h1>
        <p className="text-gray-500 mt-2">
          Theo dõi nhanh sản phẩm, tồn kho, đơn hàng và chat khách hàng.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
            {cards.map((card) => (
              <div key={card.label} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.tone}`}
                  >
                    <card.icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <button
              onClick={() => onNavigate("products")}
              className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Quản lý sản phẩm
              </h2>
              <p className="text-gray-600">
                Thêm sản phẩm mới, cập nhật giá, tồn kho và trạng thái hiển thị.
              </p>
            </button>
            <button
              onClick={() => onNavigate("orders")}
              className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Xử lý đơn hàng
              </h2>
              <p className="text-gray-600">
                Xem thông tin người nhận, chi tiết sản phẩm và cập nhật trạng thái.
              </p>
            </button>
            <button
              onClick={() => onNavigate("messages")}
              className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Chat khách hàng
              </h2>
              <p className="text-gray-600">
                Đọc và trả lời câu hỏi về sản phẩm, đơn hàng, giao hàng hoặc thanh toán.
              </p>
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Tổng số đơn hàng hiện có: {stats.orders}
          </div>
        </>
      )}
    </div>
  );
}

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const tabs = [
    { value: "dashboard" as const, label: "Tổng quan", icon: ClipboardList },
    { value: "products" as const, label: "Sản phẩm", icon: Package },
    { value: "orders" as const, label: "Đơn hàng", icon: ShoppingBag },
    { value: "messages" as const, label: "Chat", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.value
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === "dashboard" && <AdminDashboard onNavigate={setActiveTab} />}
      {activeTab === "products" && <AdminProductsPage />}
      {activeTab === "orders" && <AdminOrdersPage />}
      {activeTab === "messages" && <AdminMessagesPage />}
    </div>
  );
}
