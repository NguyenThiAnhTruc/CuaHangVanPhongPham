"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Download,
  Edit2,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { downloadCsv } from "../../lib/exportCsv";
import { supabase, Category, Product } from "../../lib/supabase";

const emptyForm = {
  category_id: "",
  name: "",
  description: "",
  price: "",
  stock: "",
  image_url: "",
  is_active: true,
};

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState(emptyForm);

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("Không thể tải danh sách sản phẩm. Vui lòng thử lại.");
    } else {
      setProducts(data ?? []);
    }

    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      setError("Không thể tải danh mục sản phẩm.");
      return;
    }

    setCategories(data ?? []);
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({ ...emptyForm, category_id: categories[0]?.id || "" });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      category_id: product.category_id || "",
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      image_url: product.image_url,
      is_active: product.is_active,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const price = Number(formData.price);
    const stock = Number(formData.stock);

    if (!formData.category_id) return "Vui lòng chọn danh mục.";
    if (!formData.name.trim()) return "Vui lòng nhập tên sản phẩm.";
    if (!Number.isFinite(price) || price < 0) return "Giá sản phẩm không hợp lệ.";
    if (!Number.isInteger(stock) || stock < 0) {
      return "Tồn kho phải là số nguyên không âm.";
    }
    if (formData.image_url && !formData.image_url.startsWith("http")) {
      return "URL hình ảnh phải bắt đầu bằng http hoặc https.";
    }

    return "";
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setFormError("Vui lòng chọn file hình ảnh.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setFormError("Ảnh không được vượt quá 3MB.");
      return;
    }

    setUploading(true);
    setFormError("");

    const extension = file.name.split(".").pop() || "jpg";
    const safeName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const storagePath = `products/${safeName}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      setFormError(error.message || "Không thể upload ảnh sản phẩm.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(storagePath);

    setFormData((current) => ({
      ...current,
      image_url: data.publicUrl,
    }));
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setSaving(true);

    const productData = {
      category_id: formData.category_id,
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      stock: Number(formData.stock),
      image_url: formData.image_url.trim(),
      is_active: formData.is_active,
      updated_at: new Date().toISOString(),
    };

    const { error } = editingProduct
      ? await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id)
      : await supabase.from("products").insert(productData);

    setSaving(false);

    if (error) {
      setFormError(error.message || "Không thể lưu sản phẩm.");
      return;
    }

    setIsModalOpen(false);
    await fetchProducts();
  };

  const handleDelete = async (product: Product) => {
    const ok = confirm(`Bạn có chắc muốn xóa "${product.name}"?`);
    if (!ok) return;

    setDeletingId(product.id);
    setError("");

    const { error } = await supabase.from("products").delete().eq("id", product.id);

    setDeletingId(null);

    if (error) {
      setError(error.message || "Không thể xóa sản phẩm.");
      return;
    }

    await fetchProducts();
  };

  const handleExportProducts = () => {
    if (products.length === 0) {
      setError("Không có sản phẩm để xuất file.");
      return;
    }

    downloadCsv(
      `officestore-san-pham-${new Date().toISOString().slice(0, 10)}.csv`,
      products.map((product) => ({
        "Mã sản phẩm": product.id,
        "Tên sản phẩm": product.name,
        "Danh mục": categoryById.get(product.category_id) || "",
        "Mô tả": product.description,
        Giá: product.price,
        "Tồn kho": product.stock,
        "Trạng thái": product.is_active ? "Hiển thị" : "Ẩn",
        "URL ảnh": product.image_url,
        "Ngày tạo": formatDate(product.created_at),
        "Ngày cập nhật": formatDate(product.updated_at),
      })),
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Quản lý sản phẩm
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Thêm, chỉnh sửa, upload ảnh, xuất file và kiểm soát tồn kho.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleExportProducts}
              disabled={loading || products.length === 0}
              className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-slate-50 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              <span>Xuất Excel</span>
            </button>
            <button
              onClick={openAddModal}
              disabled={categories.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 disabled:bg-gray-400"
            >
              <Plus className="w-5 h-5" />
              <span>Thêm sản phẩm</span>
            </button>
          </div>
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
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            Chưa có sản phẩm nào.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    {[
                      "Hình ảnh",
                      "Tên sản phẩm",
                      "Danh mục",
                      "Giá",
                      "Tồn kho",
                      "Trạng thái",
                      "Thao tác",
                    ].map((header) => (
                      <th
                        key={header}
                        className={`px-6 py-3 text-xs font-medium text-gray-700 uppercase ${
                          header === "Thao tác" ? "text-center" : "text-left"
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center text-xs text-gray-400">
                            Chưa có ảnh
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {product.description || "Chưa có mô tả"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {categoryById.get(product.category_id) || "Chưa phân loại"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4">
                        {product.is_active ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Hiển thị
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            Ẩn
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Sửa sản phẩm"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === product.id}
                            className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {formError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
                    {formError}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Danh mục
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData({ ...formData, category_id: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Tên sản phẩm
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Giá (VND)
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Tồn kho
                    </label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="0"
                      step="1"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Ảnh sản phẩm
                  </label>
                  <div className="flex flex-col gap-3">
                    {formData.image_url && (
                      <img
                        src={formData.image_url}
                        alt="Xem trước sản phẩm"
                        className="w-28 h-28 object-cover rounded border"
                      />
                    )}
                    <label className="inline-flex w-fit items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <ImagePlus className="w-4 h-4" />
                      <span>{uploading ? "Đang upload..." : "Upload ảnh"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleImageUpload(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, image_url: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Hoặc dán URL ảnh https://..."
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-700 text-sm font-medium">
                      Hiển thị sản phẩm
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2 disabled:bg-blue-400"
                >
                  <Save className="w-5 h-5" />
                  <span>
                    {saving
                      ? "Đang lưu..."
                      : editingProduct
                        ? "Cập nhật"
                        : "Thêm sản phẩm"}
                  </span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
