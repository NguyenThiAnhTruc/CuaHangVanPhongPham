"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Save, User } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

const MAX_AVATAR_INPUT_BYTES = 5 * 1024 * 1024;
const AVATAR_BUCKET = "user-avatars";

async function optimizeAvatar(file: File) {
  const image = await createImageBitmap(file);
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) return file;

  const sourceSize = Math.min(image.width, image.height);
  const sourceX = Math.max(0, Math.round((image.width - sourceSize) / 2));
  const sourceY = Math.max(0, Math.round((image.height - sourceSize) / 2));

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    size,
    size,
  );
  image.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.86);
  });

  if (!blob) return file;
  return new File([blob], "avatar.jpg", { type: "image/jpeg" });
}

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    setError("");
    setSuccess(false);

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file hình ảnh.");
      return;
    }

    if (file.size > MAX_AVATAR_INPUT_BYTES) {
      setError("Ảnh đại diện không được vượt quá 5MB.");
      return;
    }

    setUploadingAvatar(true);

    try {
      const optimizedFile = await optimizeAvatar(file);
      const storagePath = `${user.id}/${Date.now()}-${crypto.randomUUID()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(storagePath, optimizedFile, {
          cacheControl: "3600",
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        setError(`Không thể upload ảnh đại diện: ${uploadError.message}`);
        return;
      }

      const { data } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(storagePath);

      const publicUrl = data.publicUrl;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        setError(
          `Upload ảnh thành công nhưng chưa lưu được vào hồ sơ: ${updateError.message}`,
        );
        return;
      }

      setAvatarUrl(publicUrl);
      setSuccess(true);
      await refreshProfile();
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    if (!user) {
      setError("Vui lòng đăng nhập");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        address,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      setError("Không thể cập nhật thông tin. Vui lòng thử lại.");
    } else {
      setSuccess(true);
      await refreshProfile();
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Vui lòng đăng nhập để xem thông tin cá nhân
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-emerald-500 px-6 py-8 text-white">
              <p className="text-sm font-medium uppercase tracking-wide text-blue-50">
                Hồ sơ tài khoản
              </p>
              <h1 className="mt-2 text-3xl font-bold">Thông tin cá nhân</h1>
            </div>
            <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="-mt-12 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-md flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Ảnh đại diện"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-10 w-10 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-900">
                    {fullName || profile?.email || "Tài khoản"}
                  </p>
                  <p className="text-sm text-slate-500">{profile?.email}</p>
                </div>
              </div>
              <span
                className={`w-fit rounded-full border px-3 py-1 text-sm font-semibold ${
                  profile?.is_admin
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {profile?.is_admin ? "Admin" : "Khách hàng"}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4">
                Cập nhật thông tin thành công!
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-gray-800">Ảnh đại diện</p>
                  <p className="text-sm text-gray-500 mb-3">
                    Dùng cho hồ sơ cá nhân và thanh tài khoản.
                  </p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-slate-50">
                    <ImagePlus className="h-4 w-4" />
                    <span>
                      {uploadingAvatar ? "Đang upload..." : "Chọn ảnh"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingAvatar}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleAvatarUpload(file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-slate-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email không thể thay đổi
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập họ và tên"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Địa chỉ
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-blue-400 flex items-center justify-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? "Đang lưu..." : "Lưu thông tin"}</span>
              </button>
            </form>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h3 className="font-semibold text-blue-800 mb-2">Lưu ý</h3>
            <p className="text-sm text-blue-700">
              Thông tin họ tên, số điện thoại và địa chỉ sẽ được sử dụng làm
              thông tin mặc định khi bạn đặt hàng. Bạn vẫn có thể thay đổi thông
              tin này cho từng đơn hàng cụ thể.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
