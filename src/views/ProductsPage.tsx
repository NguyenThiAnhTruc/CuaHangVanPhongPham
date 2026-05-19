"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, Search, ShoppingCart, Star } from "lucide-react";
import { Category, Product, supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface ProductsPageProps {
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export function ProductsPage({
  onViewProduct,
  onAddToCart,
}: ProductsPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (!error && data) {
      setCategories(data);
    }
  }, []);

  const fetchRatings = useCallback(async (productIds: string[]) => {
    if (productIds.length === 0) {
      setRatings({});
      return;
    }

    const { data } = await supabase
      .from("product_reviews")
      .select("product_id,rating")
      .in("product_id", productIds)
      .eq("is_visible", true);

    const nextRatings: Record<string, { avg: number; count: number }> = {};
    (data ?? []).forEach((review) => {
      const current = nextRatings[review.product_id] ?? { avg: 0, count: 0 };
      nextRatings[review.product_id] = {
        avg: current.avg + Number(review.rating),
        count: current.count + 1,
      };
    });

    Object.keys(nextRatings).forEach((productId) => {
      const item = nextRatings[productId];
      item.avg = item.count ? item.avg / item.count : 0;
    });

    setRatings(nextRatings);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("products").select("*").eq("is_active", true);

    if (selectedCategory !== "all") {
      query = query.eq("category_id", selectedCategory);
    }

    if (searchTerm.trim()) {
      query = query.ilike("name", `%${searchTerm.trim()}%`);
    }

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (!error && data) {
      setProducts(data);
      void fetchRatings(data.map((product) => product.id));
    }
    setLoading(false);
  }, [fetchRatings, searchTerm, selectedCategory]);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }

    const { data } = await supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("user_id", user.id);

    setFavoriteIds(new Set((data ?? []).map((item) => item.product_id)));
  }, [user]);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchFavorites();
  }, [fetchCategories, fetchFavorites, fetchProducts]);

  const toggleFavorite = async (productId: string) => {
    if (!user) return;

    const isFavorite = favoriteIds.has(productId);
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (isFavorite) next.delete(productId);
      else next.add(productId);
      return next;
    });

    const { error } = isFavorite
      ? await supabase
          .from("wishlist_items")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId)
      : await supabase.from("wishlist_items").insert({
          user_id: user.id,
          product_id: productId,
        });

    if (error) {
      await fetchFavorites();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const stockBadge = (stock: number) => {
    if (stock === 0) return { label: "Hết hàng", className: "bg-red-500" };
    if (stock < 10) return { label: `Còn ${stock}`, className: "bg-orange-500" };
    return { label: "Còn hàng", className: "bg-green-600" };
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Sản phẩm</h1>
          <p className="text-gray-500 mt-2">
            Tìm nhanh văn phòng phẩm theo danh mục, tên sản phẩm và tình trạng tồn kho.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-lg transition ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-gray-700 hover:bg-slate-200"
              }`}
            >
              Tất cả
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedCategory === category.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-gray-700 hover:bg-slate-200"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const badge = stockBadge(product.stock);
              const rating = ratings[product.id];
              const isFavorite = favoriteIds.has(product.id);

              return (
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
                        className={`absolute top-2 right-2 text-white px-2 py-1 rounded text-xs ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 min-h-12">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2 min-h-10">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-amber-600 mb-2">
                        <Star className="w-4 h-4 fill-current" />
                        <span>
                          {rating?.count
                            ? `${rating.avg.toFixed(1)} (${rating.count})`
                            : "Chưa có đánh giá"}
                        </span>
                      </div>
                      <p className="text-xl font-bold text-blue-600">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </button>
                  <div className="px-4 pb-4 flex gap-2">
                    <button
                      onClick={() => void toggleFavorite(product.id)}
                      disabled={!user}
                      className={`w-11 h-10 rounded-lg border flex items-center justify-center transition disabled:opacity-50 ${
                        isFavorite
                          ? "border-red-200 bg-red-50 text-red-600"
                          : "border-gray-300 text-gray-500 hover:bg-slate-50"
                      }`}
                      title={isFavorite ? "Bỏ yêu thích" : "Thêm yêu thích"}
                    >
                      <Heart
                        className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`}
                      />
                    </button>
                    <button
                      onClick={() => onAddToCart(product)}
                      disabled={product.stock === 0 || !user}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>
                        {product.stock === 0 ? "Hết hàng" : "Thêm vào giỏ"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
