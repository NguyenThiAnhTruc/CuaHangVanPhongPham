"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Product, WishlistItem, supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface FavoritesPageProps {
  onNavigate: (page: string) => void;
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export function FavoritesPage({
  onNavigate,
  onViewProduct,
  onAddToCart,
}: FavoritesPageProps) {
  const { user } = useAuth();
  const [items, setItems] = useState<(WishlistItem & { product: Product })[]>(
    [],
  );
  const [ratings, setRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("wishlist_items")
      .select("*, product:products(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError("Không thể tải danh sách yêu thích.");
      setItems([]);
      setLoading(false);
      return;
    }

    const favorites = (data ?? []).filter((item) => item.product) as (
      WishlistItem & { product: Product }
    )[];
    setItems(favorites);
    await fetchRatings(favorites.map((item) => item.product_id));
    setLoading(false);
  }, [fetchRatings, user]);

  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  const removeFavorite = async (productId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);

    if (!error) {
      setItems((current) => current.filter((item) => item.product_id !== productId));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Vui lòng đăng nhập để xem sản phẩm yêu thích
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Sản phẩm yêu thích
          </h1>
          <p className="text-gray-500 mt-2">
            Danh sách sản phẩm bạn đã lưu để xem lại hoặc mua sau.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Chưa có sản phẩm yêu thích
            </h2>
            <button
              onClick={() => onNavigate("products")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Xem sản phẩm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const product = item.product;
              const rating = ratings[product.id];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition flex flex-col"
                >
                  <button
                    onClick={() => onViewProduct(product)}
                    className="text-left flex-1"
                  >
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 min-h-12">
                        {product.name}
                      </h3>
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
                  <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => void removeFavorite(product.id)}
                      className="border border-red-200 text-red-600 py-2 rounded-lg hover:bg-red-50 transition"
                    >
                      Bỏ lưu
                    </button>
                    <button
                      onClick={() => onAddToCart(product)}
                      disabled={product.stock === 0}
                      className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Mua
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
