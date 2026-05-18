"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

type OAuthProvider = "google" | "facebook";

export function LoginModal({
  isOpen,
  onClose,
  onSwitchToRegister,
}: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const { signIn, signInWithOAuth } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Vui lòng nhập email và mật khẩu");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      if (error.message?.includes("Invalid login credentials")) {
        setError("Email hoặc mật khẩu không đúng");
      } else if (error.message?.includes("Email not confirmed")) {
        setError("Vui lòng xác nhận email của bạn");
      } else {
        setError(error.message || "Đăng nhập thất bại. Vui lòng thử lại.");
      }
    } else {
      onClose();
      setEmail("");
      setPassword("");
    }
    setLoading(false);
  };

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setError("");
    setOauthLoading(provider);

    const { error } = await signInWithOAuth(provider);

    if (error) {
      setError(error.message || "Không thể đăng nhập bằng tài khoản mạng xã hội.");
      setOauthLoading(null);
    }
  };

  const isBusy = loading || oauthLoading !== null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Đăng nhập</h2>
          <button
            onClick={onClose}
            disabled={isBusy}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => handleOAuthLogin("google")}
            disabled={isBusy}
            className="border border-gray-300 rounded-lg py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-slate-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="w-5 h-5 rounded-full bg-white border border-gray-300 text-blue-600 flex items-center justify-center text-sm font-bold">
              G
            </span>
            <span>{oauthLoading === "google" ? "Đang mở..." : "Google"}</span>
          </button>
          <button
            type="button"
            onClick={() => handleOAuthLogin("facebook")}
            disabled={isBusy}
            className="border border-gray-300 rounded-lg py-2.5 px-3 text-sm font-medium text-gray-700 hover:bg-slate-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
              f
            </span>
            <span>
              {oauthLoading === "facebook" ? "Đang mở..." : "Facebook"}
            </span>
          </button>
        </div>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-gray-500">
              hoặc đăng nhập bằng email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isBusy}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isBusy}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isBusy}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600 text-sm">
          Chưa có tài khoản?{" "}
          <button
            onClick={() => {
              onClose();
              onSwitchToRegister();
            }}
            disabled={isBusy}
            className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
          >
            Đăng ký ngay
          </button>
        </p>
      </div>
    </div>
  );
}
