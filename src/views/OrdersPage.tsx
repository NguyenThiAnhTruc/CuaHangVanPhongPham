"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { Order, OrderItem, supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const statusMap: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Chờ xác nhận",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "Đã xác nhận",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  shipping: {
    label: "Đang giao hàng",
    className: "bg-violet-50 text-violet-700 border-violet-200",
  },
  delivered: {
    label: "Đã giao hàng",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "Đã hủy",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [cancelCandidate, setCancelCandidate] = useState<Order | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const fetchOrderItems = useCallback(async (orderId: string) => {
    const { data, error } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (!error && data) {
      setOrderItems((prev) => ({ ...prev, [orderId]: data }));
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
      data.forEach((order) => fetchOrderItems(order.id));
    }
    setLoading(false);
  }, [fetchOrderItems, user]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [fetchOrders, user]);

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const handleCancelOrder = (order: Order) => {
    if (order.status !== "pending" || cancellingId) return;
    setCancelCandidate(order);
  };

  const confirmCancelOrder = async () => {
    const order = cancelCandidate;
    if (!order || cancellingId) return;

    setCancellingId(order.id);
    setError("");

    const { error } = await supabase.rpc("cancel_pending_order", {
      p_order_id: order.id,
    });

    setCancellingId(null);

    if (error) {
      setError(
        error.message.includes("order_not_pending")
          ? "Chỉ có thể hủy đơn hàng đang chờ xác nhận."
          : "Không thể hủy đơn hàng. Vui lòng thử lại.",
      );
      return;
    }

    setCancelCandidate(null);
    setOrders((current) =>
      current.map((item) =>
        item.id === order.id
          ? { ...item, status: "cancelled", updated_at: new Date().toISOString() }
          : item,
      ),
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Vui lòng đăng nhập để xem đơn hàng
            </h2>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Bạn chưa có đơn hàng nào
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Đơn hàng của tôi
        </h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Mã đơn hàng</p>
                    <p className="font-mono text-sm">
                      {order.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ngày đặt</p>
                    <p className="font-medium">{formatDate(order.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng tiền</p>
                    <p className="font-bold text-blue-600">
                      {formatPrice(order.total_amount)}
                    </p>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-2">
                    {getStatusBadge(order.status)}
                    {order.status === "pending" && (
                      <button
                        onClick={() => handleCancelOrder(order)}
                        disabled={cancellingId === order.id}
                        className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                      >
                        Hủy đơn
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Người nhận</p>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-gray-600">
                        {order.customer_phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Địa chỉ giao hàng
                      </p>
                      <p className="text-sm">{order.customer_address}</p>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Ghi chú</p>
                      <p className="text-sm">{order.notes}</p>
                    </div>
                  )}

                  <button
                    onClick={() => toggleOrderExpansion(order.id)}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {expandedOrders.has(order.id) ? (
                      <>
                        <span>Ẩn chi tiết</span>
                        <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>Xem chi tiết</span>
                        <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {expandedOrders.has(order.id) && orderItems[order.id] && (
                <div className="border-t bg-slate-50 p-6">
                  <h3 className="font-semibold mb-4">Chi tiết sản phẩm</h3>
                  <div className="space-y-3">
                    {orderItems[order.id].map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center gap-4"
                      >
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-gray-600">
                            Số lượng: {item.quantity} x {formatPrice(item.price)}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatPrice(item.quantity * item.price)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {cancelCandidate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="px-6 py-5 border-b">
                <h3 className="text-xl font-bold text-gray-900">
                  Xác nhận hủy đơn hàng
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Bạn chỉ có thể hủy đơn khi đơn còn chờ xác nhận.
                </p>
              </div>
              <div className="px-6 py-5">
                <p className="text-gray-700">
                  Hủy đơn hàng{" "}
                  <span className="font-mono font-semibold text-gray-900">
                    {cancelCandidate.id.slice(0, 8).toUpperCase()}
                  </span>
                  ?
                </p>
              </div>
              <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCancelCandidate(null)}
                  disabled={Boolean(cancellingId)}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Không
                </button>
                <button
                  type="button"
                  onClick={() => void confirmCancelOrder()}
                  disabled={Boolean(cancellingId)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400"
                >
                  {cancellingId ? "Đang hủy..." : "Hủy đơn"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
