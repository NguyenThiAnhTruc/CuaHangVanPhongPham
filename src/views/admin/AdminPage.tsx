"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ClipboardList,
  FolderTree,
  MessageCircle,
  Package,
  ShoppingBag,
  TrendingUp,
  Warehouse,
  XCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AdminCategoriesPage } from "./AdminCategoriesPage";
import { AdminMessagesPage } from "./AdminMessagesPage";
import { AdminOrdersPage } from "./AdminOrdersPage";
import { AdminProductsPage } from "./AdminProductsPage";

type AdminTab = "dashboard" | "products" | "categories" | "orders" | "messages";

interface OrderStatsRow {
  id: string;
  total_amount: number;
  status: string;
}

interface DashboardStats {
  products: number;
  activeProducts: number;
  lowStock: number;
  categories: number;
  orders: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenue: number;
  openConversations: number;
}

function AdminDashboard({ onNavigate }: { onNavigate: (tab: AdminTab) => void }) {
  const [stats, setStats] = useState<DashboardStats>({
    products: 0,
    activeProducts: 0,
    lowStock: 0,
    categories: 0,
    orders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    revenue: 0,
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
        categoriesResult,
        ordersResult,
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
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id,total_amount,status"),
        supabase
          .from("conversations")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
      ]);

      const failed = [
        productsResult.error,
        activeProductsResult.error,
        lowStockResult.error,
        categoriesResult.error,
        ordersResult.error,
        conversationsResult.error,
      ].find(Boolean);

      if (failed) {
        setError("Không thể tải số liệu tổng quan.");
        setLoading(false);
        return;
      }

      const orders = (ordersResult.data ?? []) as OrderStatsRow[];
      const revenue = orders
        .filter((order) => order.status !== "cancelled")
        .reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

      setStats({
        products: productsResult.count ?? 0,
        activeProducts: activeProductsResult.count ?? 0,
        lowStock: lowStockResult.count ?? 0,
        categories: categoriesResult.count ?? 0,
        orders: orders.length,
        pendingOrders: orders.filter((order) => order.status === "pending").length,
        deliveredOrders: orders.filter((order) => order.status === "delivered").length,
        cancelledOrders: orders.filter((order) => order.status === "cancelled").length,
        revenue,
        openConversations: conversationsResult.count ?? 0,
      });

      setLoading(false);
    };

    fetchStats();
  }, []);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const cards = useMemo(
    () => [
      {
        label: "Doanh thu",
        value: formatPrice(stats.revenue),
        icon: TrendingUp,
        tone: "text-emerald-600 bg-emerald-50",
      },
      {
        label: "Tổng đơn hàng",
        value: stats.orders,
        icon: ShoppingBag,
        tone: "text-purple-600 bg-purple-50",
      },
      {
        label: "Đơn chờ xử lý",
        value: stats.pendingOrders,
        icon: ClipboardList,
        tone: "text-amber-600 bg-amber-50",
      },
      {
        label: "Đơn đã giao",
        value: stats.deliveredOrders,
        icon: Package,
        tone: "text-blue-600 bg-blue-50",
      },
      {
        label: "Đơn đã hủy",
        value: stats.cancelledOrders,
        icon: XCircle,
        tone: "text-red-600 bg-red-50",
      },
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
        label: "Danh mục",
        value: stats.categories,
        icon: FolderTree,
        tone: "text-indigo-600 bg-indigo-50",
      },
      {
        label: "Chat đang mở",
        value: stats.openConversations,
        icon: MessageCircle,
        tone: "text-cyan-600 bg-cyan-50",
      },
    ],
    [stats],
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Tổng quan quản trị</h1>
        <p className="text-gray-500 mt-2">
          Theo dõi doanh thu, đơn hàng, tồn kho, danh mục và chat khách hàng.
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
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2 truncate">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${card.tone}`}
                  >
                    <card.icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <button
              onClick={() => onNavigate("products")}
              className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Quản lý sản phẩm
              </h2>
              <p className="text-gray-600">
                Thêm sản phẩm mới, upload ảnh, cập nhật giá và tồn kho.
              </p>
            </button>
            <button
              onClick={() => onNavigate("categories")}
              className="bg-white rounded-lg shadow-sm p-6 text-left hover:shadow-md transition"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Quản lý danh mục
              </h2>
              <p className="text-gray-600">
                Tạo nhóm sản phẩm để khách hàng tìm kiếm nhanh hơn.
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
                Xem chi tiết người nhận, sản phẩm và cập nhật trạng thái.
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
                Đọc và trả lời câu hỏi về sản phẩm, đơn hàng hoặc giao hàng.
              </p>
            </button>
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
    { value: "categories" as const, label: "Danh mục", icon: FolderTree },
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
      {activeTab === "categories" && <AdminCategoriesPage />}
      {activeTab === "orders" && <AdminOrdersPage />}
      {activeTab === "messages" && <AdminMessagesPage />}
    </div>
  );
}
