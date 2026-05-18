"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Download } from "lucide-react";
import { downloadCsv } from "../../lib/exportCsv";
import type { CsvValue } from "../../lib/exportCsv";
import { supabase, Order, OrderItem } from "../../lib/supabase";

const statusMap: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Chờ xác nhận",
    className: "bg-yellow-100 text-yellow-800",
  },
  confirmed: {
    label: "Đã xác nhận",
    className: "bg-blue-100 text-blue-800",
  },
  shipping: {
    label: "Đang giao hàng",
    className: "bg-purple-100 text-purple-800",
  },
  delivered: {
    label: "Đã giao hàng",
    className: "bg-green-100 text-green-800",
  },
  cancelled: {
    label: "Đã hủy",
    className: "bg-red-100 text-red-800",
  },
};

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");

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
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại.");
      setLoading(false);
      return;
    }

    setOrders(data ?? []);
    await Promise.all((data ?? []).map((order) => fetchOrderItems(order.id)));
    setLoading(false);
  }, [fetchOrderItems]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    setError("");

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    setUpdatingOrderId(null);

    if (error) {
      setError(error.message || "Không thể cập nhật trạng thái đơn hàng.");
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order,
      ),
    );
  };

  const handleExportOrders = () => {
    if (orders.length === 0) {
      setError("Không có đơn hàng để xuất file.");
      return;
    }

    const rows: Record<string, CsvValue>[] = [];

    orders.forEach((order) => {
      const items = orderItems[order.id] ?? [];
      const baseRow = {
        "Mã đơn hàng": order.id,
        "Ngày đặt": formatDate(order.created_at),
        "Trạng thái": statusMap[order.status]?.label || order.status,
        "Tên khách hàng": order.customer_name,
        "Số điện thoại": order.customer_phone,
        "Địa chỉ giao hàng": order.customer_address,
        "Ghi chú": order.notes,
        "Tổng tiền": order.total_amount,
      };

      if (items.length === 0) {
        rows.push({
          ...baseRow,
          "Sản phẩm": "",
          "Số lượng": null,
          "Đơn giá": null,
          "Thành tiền": null,
        });
        return;
      }

      items.forEach((item) => {
        rows.push({
          ...baseRow,
          "Sản phẩm": item.product_name,
          "Số lượng": item.quantity,
          "Đơn giá": item.price,
          "Thành tiền": item.quantity * item.price,
        });
      });
    });

    downloadCsv(
      `officestore-don-hang-${new Date().toISOString().slice(0, 10)}.csv`,
      rows,
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
        className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Quản lý đơn hàng
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Theo dõi thông tin giao hàng, chi tiết sản phẩm, xuất file và cập nhật trạng thái đơn.
            </p>
          </div>
          <button
            onClick={handleExportOrders}
            disabled={loading || orders.length === 0}
            className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            <span>Xuất Excel</span>
          </button>
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
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">Chưa có đơn hàng nào.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Mã đơn hàng</p>
                      <p className="font-mono text-sm">
                        {order.id.substring(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ngày đặt</p>
                      <p className="font-medium text-sm">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tổng tiền</p>
                      <p className="font-bold text-blue-600">
                        {formatPrice(order.total_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Trạng thái</p>
                      <div className="mb-2">{getStatusBadge(order.status)}</div>
                      <select
                        value={order.status}
                        disabled={updatingOrderId === order.id}
                        onChange={(e) =>
                          updateOrderStatus(order.id, e.target.value)
                        }
                        className="text-sm border border-gray-300 rounded px-2 py-1 disabled:bg-slate-100"
                      >
                        {Object.entries(statusMap).map(([value, status]) => (
                          <option key={value} value={value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Thông tin người nhận
                        </p>
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

                {expandedOrders.has(order.id) && (
                  <div className="border-t bg-slate-50 p-6">
                    <h3 className="font-semibold mb-4">Chi tiết sản phẩm</h3>
                    {orderItems[order.id]?.length ? (
                      <div className="space-y-3">
                        {orderItems[order.id].map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center gap-4"
                          >
                            <div>
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-sm text-gray-600">
                                Số lượng: {item.quantity} x{" "}
                                {formatPrice(item.price)}
                              </p>
                            </div>
                            <p className="font-semibold">
                              {formatPrice(item.quantity * item.price)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Chưa tải được chi tiết sản phẩm.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
