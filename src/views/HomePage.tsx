"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, ShoppingCart, Tags, Truck } from "lucide-react";
import { supabase, Product } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface HomePageProps {
  onViewProduct: (product: Product) => void;
  onNavigate: (page: string) => void;
  onAddToCart: (product: Product) => void;
}

export function HomePage({
  onViewProduct,
  onNavigate,
  onAddToCart,
}: HomePageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(8);

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const stockLabel = (stock: number) => {
    if (stock === 0) return "Hết hàng";
    if (stock < 10) return `Còn ${stock}`;
    return "Còn hàng";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative min-h-[520px] overflow-hidden bg-gray-900 text-white">
        <img
          src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=85"
          alt="Không gian văn phòng hiện đại"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/75 to-gray-950/20" />
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-200">
              Văn phòng phẩm cho đội nhóm hiện đại
            </p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              OfficeStore
            </h1>
            <p className="text-lg md:text-xl text-gray-100 mb-8 max-w-xl">
              Cung cấp bút viết, giấy in, hồ sơ, vật tư in ấn và thiết bị làm việc với mức giá rõ ràng, dễ đặt hàng.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onNavigate("products")}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition inline-flex items-center justify-center gap-2"
              >
                Xem sản phẩm
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => onNavigate("products")}
                className="bg-white/10 border border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/20 transition"
              >
                Mua nhanh cho văn phòng
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: ShieldCheck,
              title: "Chất lượng ổn định",
              text: "Sản phẩm rõ nguồn, phù hợp nhu cầu văn phòng hằng ngày.",
            },
            {
              icon: Tags,
              title: "Giá dễ kiểm soát",
              text: "Danh mục gọn, giá minh bạch, thuận tiện đặt mua số lượng.",
            },
            {
              icon: Truck,
              title: "Giao hàng nhanh",
              text: "Hỗ trợ xử lý đơn hàng và theo dõi trạng thái rõ ràng.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="group bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl animate-card-rise"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <div className="mb-4 w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center transition-all duration-300 group-hover:bg-blue-600 group-hover:rotate-3 group-hover:scale-110">
                <item.icon className="w-7 h-7 text-blue-600 transition-colors duration-300 group-hover:text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600 text-sm">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Sản phẩm nổi bật
            </h2>
            <p className="text-gray-500 mt-2">
              Các mặt hàng phổ biến cho văn phòng, trường học và cửa hàng.
            </p>
          </div>
          <button
            onClick={() => onNavigate("products")}
            className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
          >
            Xem tất cả
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition group flex flex-col"
              >
                <button
                  onClick={() => onViewProduct(product)}
                  className="text-left flex-1"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <span
                      className={`absolute top-2 right-2 px-2 py-1 rounded text-xs text-white ${
                        product.stock === 0
                          ? "bg-red-500"
                          : product.stock < 10
                            ? "bg-orange-500"
                            : "bg-green-600"
                      }`}
                    >
                      {stockLabel(product.stock)}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 min-h-12">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 min-h-10">
                      {product.description}
                    </p>
                    <p className="text-xl font-bold text-blue-600 mt-3">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </button>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => onAddToCart(product)}
                    disabled={product.stock === 0 || !user}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{product.stock === 0 ? "Hết hàng" : "Thêm vào giỏ"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
