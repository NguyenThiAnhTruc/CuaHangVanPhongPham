"use client";

import { useMemo, useState } from "react";
import { CheckCircle, CreditCard, MapPin, Phone, User } from "lucide-react";
import { supabase, CartItem, Product } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface CheckoutPageProps {
  cartItems: (CartItem & { product: Product })[];
  total: number;
  onNavigate: (page: string) => void;
  onOrderComplete: () => void;
}

type PaymentMethod = "cod" | "bank_transfer";

const paymentLabels: Record<PaymentMethod, string> = {
  cod: "Thanh toán khi nhận hàng",
  bank_transfer: "Chuyển khoản ngân hàng",
};

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 45000) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("timeout")), timeoutMs);
  });

  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function getCheckoutErrorMessage(message: string) {
  if (message === "timeout") {
    return "Supabase phản hồi quá lâu. Vui lòng kiểm tra mạng rồi thử lại.";
  }

  if (message.includes("empty_cart")) {
    return "Giỏ hàng đang trống hoặc đã được thanh toán. Vui lòng kiểm tra lại.";
  }

  if (message.includes("missing_customer_information")) {
    return "Vui lòng điền đầy đủ thông tin giao hàng.";
  }

  if (message.includes("cart_item_unavailable")) {
    return "Một số sản phẩm không đủ số lượng hoặc đã ngừng bán. Vui lòng cập nhật giỏ hàng.";
  }

  if (message.includes("JWT") || message.includes("not_authenticated")) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để đặt hàng.";
  }

  return "Không thể tạo đơn hàng. Vui lòng thử lại.";
}

export function CheckoutPage({
  cartItems,
  total,
  onNavigate,
  onOrderComplete,
}: CheckoutPageProps) {
  const { user, profile } = useAuth();
  const [customerName, setCustomerName] = useState(profile?.full_name || "");
  const [customerPhone, setCustomerPhone] = useState(profile?.phone || "");
  const [customerAddress, setCustomerAddress] = useState(
    profile?.address || "",
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState("");

  const computedTotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.product.price || 0) * item.quantity,
      0,
    );
  }, [cartItems]);

  const orderTotal = computedTotal || total;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const validateForm = () => {
    const normalizedPhone = customerPhone.replace(/\s/g, "");

    if (!user) return "Vui lòng đăng nhập để đặt hàng.";
    if (cartItems.length === 0) return "Giỏ hàng đang trống.";
    if (!customerName.trim()) return "Vui lòng nhập họ và tên.";
    if (!customerPhone.trim()) return "Vui lòng nhập số điện thoại.";
    if (!/^(0|\+84)[0-9]{8,10}$/.test(normalizedPhone)) {
      return "Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam.";
    }
    if (!customerAddress.trim()) return "Vui lòng nhập địa chỉ giao hàng.";
    if (cartItems.some((item) => item.quantity > item.product.stock)) {
      return "Một số sản phẩm trong giỏ đã vượt quá tồn kho hiện tại.";
    }

    return "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;

    setError("");

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const finalNotes = [
      `Phương thức thanh toán: ${paymentLabels[paymentMethod]}`,
      notes.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    setLoading(true);

    try {
      const { data, error: orderError } = await withTimeout(
        supabase.rpc("create_order_from_cart", {
          p_customer_name: customerName.trim(),
          p_customer_phone: customerPhone.trim(),
          p_customer_address: customerAddress.trim(),
          p_notes: finalNotes,
        }),
      );

      if (orderError) {
        setError(getCheckoutErrorMessage(orderError.message));
        return;
      }

      setCreatedOrderId(typeof data === "string" ? data : "");
      setOrderSuccess(true);
      setTimeout(() => {
        onOrderComplete();
        onNavigate("orders");
      }, 1800);
    } catch (checkoutError) {
      setError(getCheckoutErrorMessage((checkoutError as Error).message));
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Đặt hàng thành công!
            </h2>
            <p className="text-gray-600 mb-3">
              Cảm ơn bạn đã đặt hàng. Admin sẽ xác nhận và liên hệ giao hàng sớm.
            </p>
            {createdOrderId && (
              <p className="text-sm text-gray-500 mb-6">
                Mã đơn hàng: {createdOrderId.slice(0, 8).toUpperCase()}
              </p>
            )}
            <p className="text-sm text-gray-500">
              Đang chuyển hướng đến trang đơn hàng...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Thanh toán</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Thông tin giao hàng
              </h2>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ví dụ: 0901234567"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Địa chỉ giao hàng <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                    <textarea
                      value={customerAddress}
                      onChange={(event) =>
                        setCustomerAddress(event.target.value)
                      }
                      rows={3}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Phương thức thanh toán
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(["cod", "bank_transfer"] as PaymentMethod[]).map(
                      (method) => (
                        <label
                          key={method}
                          className={`border rounded-lg p-4 cursor-pointer transition ${
                            paymentMethod === method
                              ? "border-blue-600 bg-blue-50"
                              : "border-gray-300 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method}
                            checked={paymentMethod === method}
                            onChange={() => setPaymentMethod(method)}
                            className="sr-only"
                          />
                          <span className="flex items-center gap-2 font-medium text-gray-800">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            {paymentLabels[method]}
                          </span>
                          <span className="block text-sm text-gray-500 mt-2">
                            {method === "cod"
                              ? "Thanh toán tiền mặt khi nhận sản phẩm."
                              : "Admin sẽ liên hệ gửi thông tin chuyển khoản."}
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Ghi chú đơn hàng
                  </label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    placeholder="Ví dụ: thời gian nhận hàng, chỉ dẫn địa điểm giao..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || cartItems.length === 0}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-blue-400"
              >
                {loading ? "Đang xử lý..." : "Đặt hàng"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Đơn hàng của bạn
              </h2>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-600">
                      {item.product.name} x {item.quantity}
                    </span>
                    <span className="font-medium whitespace-nowrap">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span>{formatPrice(orderTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span>Miễn phí</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Thanh toán</span>
                  <span className="text-right">{paymentLabels[paymentMethod]}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">{formatPrice(orderTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
