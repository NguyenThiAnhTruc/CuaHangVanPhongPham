"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Edit2, Plus, Save, Trash2, X } from "lucide-react";
import { Category, supabase } from "../../lib/supabase";

const emptyForm = {
  name: "",
  description: "",
  slug: "",
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState(emptyForm);

  const fetchCategories = async () => {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      setError("Không thể tải danh mục.");
    } else {
      setCategories(data ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData(emptyForm);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      slug: category.slug,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Vui lòng nhập tên danh mục.";
    const slug = formData.slug.trim() || slugify(formData.name);
    if (!slug) return "Slug danh mục không hợp lệ.";
    return "";
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setSaving(true);

    const categoryData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      slug: formData.slug.trim() || slugify(formData.name),
    };

    const { error } = editingCategory
      ? await supabase
          .from("categories")
          .update(categoryData)
          .eq("id", editingCategory.id)
      : await supabase.from("categories").insert(categoryData);

    setSaving(false);

    if (error) {
      setFormError(error.message || "Không thể lưu danh mục.");
      return;
    }

    setIsModalOpen(false);
    await fetchCategories();
  };

  const handleDelete = async (category: Category) => {
    const ok = confirm(`Bạn có chắc muốn xóa danh mục "${category.name}"?`);
    if (!ok) return;

    setDeletingId(category.id);
    setError("");

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    setDeletingId(null);

    if (error) {
      setError(error.message || "Không thể xóa danh mục.");
      return;
    }

    await fetchCategories();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Quản lý danh mục
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Thêm, chỉnh sửa và sắp xếp nhóm sản phẩm văn phòng phẩm.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm danh mục</span>
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
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
            Chưa có danh mục nào.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Tên danh mục
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Mô tả
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {category.slug}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {category.description || "Chưa có mô tả"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditModal(category)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Sửa danh mục"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            disabled={deletingId === category.id}
                            className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                            title="Xóa danh mục"
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
            <div className="bg-white rounded-lg max-w-xl w-full">
              <div className="border-b px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingCategory ? "Sửa danh mục" : "Thêm danh mục"}
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
                    Tên danh mục
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) => {
                      const name = event.target.value;
                      setFormData((current) => ({
                        ...current,
                        name,
                        slug:
                          !editingCategory || current.slug === slugify(current.name)
                            ? slugify(name)
                            : current.slug,
                      }));
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(event) =>
                      setFormData({ ...formData, slug: slugify(event.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        description: event.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:bg-blue-400"
                >
                  <Save className="w-5 h-5" />
                  <span>
                    {saving
                      ? "Đang lưu..."
                      : editingCategory
                        ? "Cập nhật"
                        : "Thêm danh mục"}
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
