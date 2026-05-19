"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { supabase, Product, CartItem } from "./lib/supabase";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { LoginModal } from "./components/auth/LoginModal";
import { RegisterModal } from "./components/auth/RegisterModal";
import { ProductDetailModal } from "./components/products/ProductDetailModal";
import { ToastContainer } from "./components/common/ToastContainer";
import { useToast } from "./hooks/useToast";
import { HomePage } from "./views/HomePage";
import { ProductsPage } from "./views/ProductsPage";
import { CartPage } from "./views/CartPage";
import { CheckoutPage } from "./views/CheckoutPage";
import { OrdersPage } from "./views/OrdersPage";
import { ProfilePage } from "./views/ProfilePage";
import { ChatPage } from "./views/ChatPage";
import { FavoritesPage } from "./views/FavoritesPage";
import { AdminPage } from "./views/admin/AdminPage";

type Page =
  | "home"
  | "products"
  | "cart"
  | "checkout"
  | "orders"
  | "profile"
  | "chat"
  | "favorites"
  | "admin";

const validPages: Page[] = [
  "home",
  "products",
  "cart",
  "checkout",
  "orders",
  "profile",
  "chat",
  "favorites",
  "admin",
];

function isPage(value: string): value is Page {
  return validPages.includes(value as Page);
}

function AppContent() {
  const { user, profile, loading } = useAuth();
  const { toasts, removeToast, success, error } = useToast();
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [checkoutData, setCheckoutData] = useState<{
    items: (CartItem & { product: Product })[];
    total: number;
  } | null>(null);

  const fetchCartCount = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("cart_items")
      .select("id")
      .eq("user_id", user.id);

    if (!error && data) {
      setCartItemCount(data.length);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCartCount();
    } else {
      setCartItemCount(0);
    }
  }, [fetchCartCount, user]);

  const handleAddToCart = async (product: Product, quantity: number = 1) => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }

    if (quantity > product.stock) {
      error(`Chỉ còn ${product.stock} sản phẩm trong kho`);
      return;
    }

    try {
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();

      const totalQuantity = (existingItem?.quantity || 0) + quantity;

      if (totalQuantity > product.stock) {
        error(`Chỉ còn ${product.stock} sản phẩm trong kho`);
        return;
      }

      if (existingItem) {
        await supabase
          .from("cart_items")
          .update({
            quantity: totalQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingItem.id);
      } else {
        await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: product.id,
          quantity: quantity,
        });
      }

      success(`Đã thêm ${product.name} vào giỏ hàng`);
      fetchCartCount();
    } catch {
      error("Không thể thêm sản phẩm vào giỏ hàng");
    }
  };

  const handleNavigate = (page: string) => {
    if (!isPage(page)) return;
    if (page === "admin" && !profile?.is_admin) return;
    if (page === "chat" && profile?.is_admin) {
      setCurrentPage("admin");
      return;
    }
    if (page === "favorites" && profile?.is_admin) {
      setCurrentPage("admin");
      return;
    }
    if (page === "chat" && !user) {
      setIsLoginModalOpen(true);
      return;
    }
    if (page === "favorites" && !user) {
      setIsLoginModalOpen(true);
      return;
    }

    setCurrentPage(page);
  };

  const handleCheckout = (
    items: (CartItem & { product: Product })[],
    total: number,
  ) => {
    setCheckoutData({ items, total });
    setCurrentPage("checkout");
  };

  const handleOrderComplete = () => {
    setCheckoutData(null);
    fetchCartCount();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        onLoginClick={() => setIsLoginModalOpen(true)}
        onRegisterClick={() => setIsRegisterModalOpen(true)}
        onCartClick={() => setCurrentPage("cart")}
        cartItemCount={cartItemCount}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

      <main className="flex-1">
        {currentPage === "home" && (
          <HomePage
            onViewProduct={setSelectedProduct}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
          />
        )}
        {currentPage === "products" && (
          <ProductsPage
            onViewProduct={setSelectedProduct}
            onAddToCart={handleAddToCart}
          />
        )}
        {currentPage === "cart" && (
          <CartPage
            onNavigate={handleNavigate}
            onCheckout={handleCheckout}
            onCartUpdate={fetchCartCount}
          />
        )}
        {currentPage === "checkout" && checkoutData && (
          <CheckoutPage
            cartItems={checkoutData.items}
            total={checkoutData.total}
            onNavigate={handleNavigate}
            onOrderComplete={handleOrderComplete}
          />
        )}
        {currentPage === "orders" && <OrdersPage />}
        {currentPage === "profile" && <ProfilePage />}
        {currentPage === "chat" && <ChatPage />}
        {currentPage === "favorites" && (
          <FavoritesPage
            onNavigate={handleNavigate}
            onViewProduct={setSelectedProduct}
            onAddToCart={handleAddToCart}
          />
        )}
        {currentPage === "admin" && profile?.is_admin && <AdminPage />}
      </main>

      <Footer />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
