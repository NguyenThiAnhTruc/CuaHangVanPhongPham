"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Edit2,
  ImagePlus,
  Info,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { PostgrestError } from "@supabase/supabase-js";
import { downloadCsv } from "../../lib/exportCsv";
import {
  supabase,
  supabaseProjectUrl,
  supabasePublicAnonKey,
  Category,
  Product,
} from "../../lib/supabase";

type ProductFormData = {
  category_id: string;
  name: string;
  description: string;
  price: string;
  stock: string;
  image_url: string;
  is_active: boolean;
};

type SupabaseLikeError = PostgrestError | Error | { message: string } | null;
type DialogTone = "success" | "error" | "info";

type DialogState = {
  tone: DialogTone;
  title: string;
  message: string;
} | null;

type ProductMutationData = {
  category_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  is_active: boolean;
  updated_at: string;
};

type AdminRestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: ProductMutationData;
  timeoutMs?: number;
};

const MAX_PRODUCT_IMAGE_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_PRODUCT_IMAGE_UPLOAD_BYTES = 3 * 1024 * 1024;
const PRODUCT_IMAGE_UPLOAD_TIMEOUT_MS = 120000;
const PRODUCT_IMAGE_BUCKET = "product-images";

const emptyForm: ProductFormData = {
  category_id: "",
  name: "",
  description: "",
  price: "",
  stock: "",
  image_url: "",
  is_active: true,
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

function getErrorMessage(error: SupabaseLikeError, fallback: string) {
  if (!error) return fallback;
  if (error.message === "timeout") {
    return "Supabase phản hồi quá lâu. Vui lòng kiểm tra mạng rồi thử lại.";
  }
  if (error.message.includes("row-level security")) {
    return "Tài khoản hiện tại chưa có quyền admin để thực hiện thao tác này.";
  }
  if (error.message.includes("duplicate key")) {
    return "Dữ liệu bị trùng. Vui lòng kiểm tra lại tên hoặc mã liên quan.";
  }
  return error.message || fallback;
}

async function getAdminAccessToken() {
  const sessionResult = await withTimeout(supabase.auth.getSession(), 10000);
  const session = sessionResult.data.session;

  if (sessionResult.error || !session?.access_token) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại tài khoản admin.");
  }

  return session.access_token;
}

async function parseRestError(response: Response) {
  const text = await response.text();
  if (!text) return "Không thể kết nối Supabase.";

  try {
    const parsed = JSON.parse(text) as {
      message?: string;
      hint?: string;
      details?: string;
    };
    return parsed.message || parsed.hint || parsed.details || text;
  } catch {
    return text;
  }
}

async function fileToOptimizedImage(file: File) {
  if (file.size <= 900 * 1024 && file.type !== "image/png") return file;

  const image = await createImageBitmap(file);
  const maxSize = 900;
  const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return file;

  context.drawImage(image, 0, 0, width, height);
  image.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.78);
  });

  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
  });
}

async function requestAdminRest<T>(
  endpoint: string,
  { method = "GET", body, timeoutMs = 30000 }: AdminRestOptions = {},
) {
  const accessToken = await getAdminAccessToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${supabaseProjectUrl}${endpoint}`, {
      method,
      headers: {
        apikey: supabasePublicAnonKey,
        Authorization: `Bearer ${accessToken}`,
        "Accept-Profile": "public",
        "Content-Profile": "public",
        "Content-Type": "application/json",
        ...(method === "GET" ? {} : { Prefer: "return=minimal" }),
      },
      body: method === "GET" || method === "DELETE" ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await parseRestError(response));
    }

    if (response.status === 204) return null as T;

    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Supabase phản hồi quá lâu. Vui lòng kiểm tra mạng rồi thử lại.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function uploadProductImage(file: File, storagePath: string) {
  const accessToken = await getAdminAccessToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    PRODUCT_IMAGE_UPLOAD_TIMEOUT_MS,
  );

  try {
    const response = await fetch(
      `${supabaseProjectUrl}/storage/v1/object/${PRODUCT_IMAGE_BUCKET}/${storagePath}`,
      {
        method: "POST",
        headers: {
          apikey: supabasePublicAnonKey,
          Authorization: `Bearer ${accessToken}`,
          "Cache-Control": "3600",
          "Content-Type": file.type || "image/jpeg",
          "x-upsert": "false",
        },
        body: file,
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw new Error(await parseRestError(response));
    }
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      throw new Error("Upload ảnh quá lâu. Vui lòng kiểm tra mạng rồi thử lại.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestProductMutation(
  method: "POST" | "PATCH" | "DELETE",
  productId?: string,
  productData?: ProductMutationData,
) {
  const query = productId ? `?id=eq.${encodeURIComponent(productId)}` : "";
  await requestAdminRest<null>(`/rest/v1/products${query}`, {
    method,
    body: productData,
    timeoutMs: 90000,
  });
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category.name]));
  }, [categories]);

  const showDialog = useCallback(
    (tone: DialogTone, title: string, message: string) => {
      setDialog({ tone, title, message });
    },
    [],
  );

  const fetchProducts = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const data = await requestAdminRest<Product[]>(
        "/rest/v1/products?select=*&order=created_at.desc",
      );
      setProducts(data ?? []);
    } catch (error) {
      const message = getErrorMessage(
        error as Error,
        "Không thể tải danh sách sản phẩm.",
      );
      setError(message);
      showDialog("error", "Không thể tải sản phẩm", message);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [showDialog]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await requestAdminRest<Category[]>(
        "/rest/v1/categories?select=*&order=name.asc",
      );
      setCategories(data ?? []);
    } catch (error) {
      const message = getErrorMessage(
        error as Error,
        "Không thể tải danh mục sản phẩm.",
      );
      setError(message);
      showDialog("error", "Không thể tải danh mục", message);
    }
  }, [showDialog]);

  useEffect(() => {
    void fetchProducts();
    void fetchCategories();
  }, [fetchCategories, fetchProducts]);

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
      const message = "Vui lòng chọn file hình ảnh.";
      setFormError(message);
      showDialog("error", "File không hợp lệ", message);
      return;
    }

    if (file.size > MAX_PRODUCT_IMAGE_INPUT_BYTES) {
      const message = "Ảnh không được vượt quá 8MB.";
      setFormError(message);
      showDialog("error", "Ảnh quá lớn", message);
      return;
    }

    setUploading(true);
    setFormError("");

    try {
      const optimizedFile = await fileToOptimizedImage(file);
      if (optimizedFile.size > MAX_PRODUCT_IMAGE_UPLOAD_BYTES) {
        const message = "Ảnh sau khi tối ưu vẫn vượt quá 3MB. Vui lòng chọn ảnh nhỏ hơn.";
        setFormError(message);
        showDialog("error", "Ảnh quá lớn", message);
        return;
      }

      const extension = optimizedFile.type === "image/webp" ? "webp" : "jpg";
      const safeName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const storagePath = `products/${safeName}`;

      await uploadProductImage(optimizedFile, storagePath);

      const { data } = supabase.storage
        .from(PRODUCT_IMAGE_BUCKET)
        .getPublicUrl(storagePath);

      setFormData((current) => ({
        ...current,
        image_url: data.publicUrl,
      }));
      showDialog("success", "Upload ảnh thành công", "Ảnh sản phẩm đã được tải lên.");
    } catch (err) {
      const message = getErrorMessage(
        err as Error,
        "Không thể upload ảnh sản phẩm.",
      );
      setFormError(message);
      showDialog("error", "Upload ảnh thất bại", message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || uploading) return;

    setFormError("");

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      showDialog("error", "Dữ liệu chưa hợp lệ", validationMessage);
      return;
    }

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

    setSaving(true);

    try {
      await requestProductMutation(
        editingProduct ? "PATCH" : "POST",
        editingProduct?.id,
        productData,
      );

      setIsModalOpen(false);
      await fetchProducts(false);
      showDialog(
        "success",
        editingProduct ? "Cập nhật thành công" : "Thêm sản phẩm thành công",
        editingProduct
          ? "Sản phẩm đã được cập nhật trong danh sách quản trị."
          : "Thêm sản phẩm thành công.",
      );
    } catch (err) {
      if ((err as Error).message !== "timeout") {
        console.warn("SAVE PRODUCT UNEXPECTED WARNING:", err);
      }
      const message = getErrorMessage(err as Error, "Không thể lưu sản phẩm.");
      setFormError(message);
      showDialog("error", "Lưu sản phẩm thất bại", message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (product: Product) => {
    if (deletingId) return;
    setDeleteCandidate(product);
  };

  const confirmDeleteProduct = async () => {
    const product = deleteCandidate;
    if (!product || deletingId) return;

    setDeletingId(product.id);
    setError("");

    try {
      await requestProductMutation("DELETE", product.id);

      setProducts((current) => current.filter((item) => item.id !== product.id));
      setDeleteCandidate(null);
      showDialog("success", "Xóa sản phẩm thành công", `Đã xóa sản phẩm "${product.name}".`);
    } catch (err) {
      if ((err as Error).message !== "timeout") {
        console.warn("DELETE PRODUCT UNEXPECTED WARNING:", err);
      }
      const message = getErrorMessage(err as Error, "Không thể xóa sản phẩm.");
      setError(message);
      showDialog("error", "Xóa sản phẩm thất bại", message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportProducts = () => {
    if (products.length === 0) {
      const message = "Không có sản phẩm để xuất file.";
      setError(message);
      showDialog("info", "Chưa có dữ liệu", message);
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
    showDialog("success", "Xuất file thành công", "Đã xuất file sản phẩm.");
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
                  disabled={saving || uploading}
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

        {deleteCandidate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="px-6 py-5 border-b">
                <h3 className="text-xl font-bold text-gray-900">
                  Xác nhận xóa sản phẩm
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Thao tác này sẽ xóa sản phẩm khỏi hệ thống.
                </p>
              </div>
              <div className="px-6 py-5">
                <p className="text-gray-700">
                  Bạn có chắc muốn xóa{" "}
                  <span className="font-semibold text-gray-900">
                    {deleteCandidate.name}
                  </span>
                  ?
                </p>
              </div>
              <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteCandidate(null)}
                  disabled={Boolean(deletingId)}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDeleteProduct()}
                  disabled={Boolean(deletingId)}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400"
                >
                  {deletingId ? "Đang xóa..." : "Xóa sản phẩm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {dialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="px-6 py-5 flex items-start gap-3">
                <div
                  className={`mt-1 rounded-full p-2 ${
                    dialog.tone === "success"
                      ? "bg-green-100 text-green-700"
                      : dialog.tone === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {dialog.tone === "success" ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : dialog.tone === "error" ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : (
                    <Info className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {dialog.title}
                  </h3>
                  <p className="text-gray-600 mt-2 leading-relaxed">
                    {dialog.message}
                  </p>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDialog(null)}
                  className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
