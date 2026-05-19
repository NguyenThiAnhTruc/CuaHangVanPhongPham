"use client";

import { Minus, Plus, ShoppingCart, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Product, ProductReview, supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen || !product) return;

    const fetchReviews = async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("*, profile:profiles(full_name,email)")
        .eq("product_id", product.id)
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

      setReviews((data ?? []) as ProductReview[]);
    };

    const checkCanReview = async () => {
      if (!user) {
        setCanReview(false);
        return;
      }

      const { data } = await supabase.rpc("has_user_purchased_product", {
        p_product_id: product.id,
      });
      setCanReview(Boolean(data));
    };

    setReviewError("");
    setReviewComment("");
    setReviewRating(5);
    void fetchReviews();
    void checkCanReview();
  }, [isOpen, product, user]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return (
      reviews.reduce((sum, review) => sum + Number(review.rating), 0) /
      reviews.length
    );
  }, [reviews]);
  const existingReview = reviews.find((review) => review.user_id === user?.id);

  if (!isOpen || !product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    onClose();
    setQuantity(1);
  };

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !canReview || reviewSaving) return;

    setReviewError("");
    setReviewSaving(true);

    const payload = {
      user_id: user.id,
      product_id: product.id,
      rating: reviewRating,
      comment: reviewComment.trim(),
      updated_at: new Date().toISOString(),
    };

    const { error } = existingReview
      ? await supabase
          .from("product_reviews")
          .update(payload)
          .eq("id", existingReview.id)
      : await supabase.from("product_reviews").insert(payload);

    setReviewSaving(false);

    if (error) {
      setReviewError(
        error.message.includes("has_user_purchased")
          ? "Bạn cần mua và nhận sản phẩm trước khi đánh giá."
          : "Không thể lưu đánh giá. Vui lòng thử lại.",
      );
      return;
    }

    const { data } = await supabase
      .from("product_reviews")
      .select("*, profile:profiles(full_name,email)")
      .eq("product_id", product.id)
      .eq("is_visible", true)
      .order("created_at", { ascending: false });
    setReviews((data ?? []) as ProductReview[]);
    setReviewComment("");
    setReviewRating(5);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Chi tiết sản phẩm
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full rounded-lg shadow-lg bg-slate-100"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                {product.name}
              </h1>

              <div className="mb-6">
                <p className="text-3xl font-bold text-blue-600">
                  {formatPrice(product.price)}
                </p>
                <div className="flex items-center gap-2 text-sm text-amber-600 mt-2">
                  <Star className="w-4 h-4 fill-current" />
                  <span>
                    {reviews.length
                      ? `${averageRating.toFixed(1)} / 5 (${reviews.length} đánh giá)`
                      : "Chưa có đánh giá"}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Mô tả
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description || "Chưa có mô tả cho sản phẩm này."}
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Tình trạng
                </h3>
                {product.stock > 0 ? (
                  <p className="text-green-600 font-medium">
                    Còn {product.stock} sản phẩm
                  </p>
                ) : (
                  <p className="text-red-600 font-medium">Hết hàng</p>
                )}
              </div>

              {product.stock > 0 && user && (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Số lượng
                    </h3>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                        disabled={quantity <= 1}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-xl font-semibold w-12 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() =>
                          setQuantity((value) => Math.min(product.stock, value + 1))
                        }
                        disabled={quantity >= product.stock}
                        className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Thêm vào giỏ hàng</span>
                    </button>
                  </div>
                </>
              )}

              {!user && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    Vui lòng đăng nhập để mua sản phẩm
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 border-t pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Đánh giá sản phẩm
            </h3>

            {user && canReview && (
              <form
                onSubmit={submitReview}
                className="bg-slate-50 rounded-lg p-4 mb-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewRating(rating)}
                      className={`${
                        rating <= reviewRating
                          ? "text-amber-500"
                          : "text-gray-300"
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  rows={3}
                  placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {reviewError && (
                  <p className="text-sm text-red-600 mt-2">{reviewError}</p>
                )}
                <button
                  type="submit"
                  disabled={reviewSaving}
                  className="mt-3 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {reviewSaving
                    ? "Đang lưu..."
                    : existingReview
                      ? "Cập nhật đánh giá"
                      : "Gửi đánh giá"}
                </button>
              </form>
            )}

            {user && !canReview && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-yellow-800">
                Bạn cần mua và nhận sản phẩm này trước khi đánh giá.
              </div>
            )}

            {reviews.length === 0 ? (
              <p className="text-gray-500">Chưa có đánh giá nào.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {review.profile?.full_name ||
                            review.profile?.email ||
                            "Người dùng"}
                        </p>
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Star
                              key={rating}
                              className={`w-4 h-4 ${
                                rating <= review.rating ? "fill-current" : ""
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-gray-600">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
