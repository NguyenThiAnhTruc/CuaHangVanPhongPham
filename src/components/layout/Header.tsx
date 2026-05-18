"use client";

import {
  LogOut,
  Menu,
  MessageCircle,
  Package,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onCartClick: () => void;
  cartItemCount: number;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Header({
  onLoginClick,
  onRegisterClick,
  onCartClick,
  cartItemCount,
  currentPage,
  onNavigate,
}: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (page: string) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  const navClass = (page: string) =>
    `text-sm font-medium transition ${
      currentPage === page ? "text-blue-600" : "text-gray-700 hover:text-blue-600"
    }`;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => navigate("home")}
            className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition"
          >
            OfficeStore
          </button>

          <nav className="hidden md:flex items-center space-x-8">
            <button onClick={() => navigate("home")} className={navClass("home")}>
              Trang chủ
            </button>
            <button
              onClick={() => navigate("products")}
              className={navClass("products")}
            >
              Sản phẩm
            </button>
            {profile?.is_admin && (
              <button
                onClick={() => navigate("admin")}
                className={navClass("admin")}
              >
                Quản trị
              </button>
            )}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <button
                  onClick={() => navigate("orders")}
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition"
                >
                  <Package className="w-5 h-5" />
                  <span>Đơn hàng</span>
                </button>

                {!profile?.is_admin && (
                  <button
                    onClick={() => navigate("chat")}
                    className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Chat</span>
                  </button>
                )}

                <button
                  onClick={onCartClick}
                  className="relative flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => navigate("profile")}
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition"
                >
                  <User className="w-5 h-5" />
                  <span>{profile?.full_name || "Tài khoản"}</span>
                </button>

                <button
                  onClick={signOut}
                  className="flex items-center space-x-1 text-gray-700 hover:text-red-600 transition"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  className="text-gray-700 hover:text-blue-600 transition"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={onRegisterClick}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen((open) => !open)}
            className="md:hidden text-gray-700 p-2"
            aria-label="Mở menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <button onClick={() => navigate("home")} className={navClass("home")}>
              Trang chủ
            </button>
            <button
              onClick={() => navigate("products")}
              className={`block ${navClass("products")}`}
            >
              Sản phẩm
            </button>
            {profile?.is_admin && (
              <button
                onClick={() => navigate("admin")}
                className={`block ${navClass("admin")}`}
              >
                Quản trị
              </button>
            )}

            <div className="pt-3 border-t border-gray-100 flex flex-col gap-3">
              {user ? (
                <>
                  <button
                    onClick={() => navigate("orders")}
                    className="text-left text-gray-700"
                  >
                    Đơn hàng
                  </button>
                  {!profile?.is_admin && (
                    <button
                      onClick={() => navigate("chat")}
                      className="text-left text-gray-700"
                    >
                      Chat
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onCartClick();
                      setMobileOpen(false);
                    }}
                    className="text-left text-gray-700"
                  >
                    Giỏ hàng {cartItemCount > 0 ? `(${cartItemCount})` : ""}
                  </button>
                  <button
                    onClick={() => navigate("profile")}
                    className="text-left text-gray-700"
                  >
                    {profile?.full_name || "Tài khoản"}
                  </button>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileOpen(false);
                    }}
                    className="text-left text-red-600"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onLoginClick();
                      setMobileOpen(false);
                    }}
                    className="text-left text-gray-700"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => {
                      onRegisterClick();
                      setMobileOpen(false);
                    }}
                    className="text-left text-blue-600 font-medium"
                  >
                    Đăng ký
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
