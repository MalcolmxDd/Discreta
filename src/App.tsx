import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { AdminProvider } from "./context/AdminContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import {
  Home,
  Products,
  ProductDetail,
  Cart,
  AdminLayout,
  Dashboard,
  ProductsPage,
  ProductFormPage,
  CategoriesPage,
  OrdersPage,
  CouponsPage,
  AdminLoginPage,
} from "./pages";
import ToastContainer from "./components/ToastContainer";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/home.css";
import "./styles/products.css";
import "./styles/cart.css";
import "./styles/pages.css";
import "./styles/admin.css";

// Lazy-loaded routes (non-critical)
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Envios = lazy(() => import("./pages/Envios"));
const Devoluciones = lazy(() => import("./pages/Devoluciones"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Terminos = lazy(() => import("./pages/Terminos"));
const Privacidad = lazy(() => import("./pages/Privacidad"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const OrderStatus = lazy(() => import("./pages/OrderStatus"));
const Account = lazy(() => import("./pages/Account"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

function LazyFallback() {
  return (
    <div className="page" style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
      <div className="skeleton" style={{ width: 60, height: 60, borderRadius: "50%" }} />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
          <WishlistProvider>
          <CartProvider>
              <AdminProvider>
                <Suspense fallback={<LazyFallback />}>
                  <Routes>
                    <Route element={<Layout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/productos" element={<Products />} />
                      <Route path="/productos/:slug" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/order-status" element={<OrderStatus />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/checkout/success" element={<CheckoutSuccess />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/envios" element={<Envios />} />
                      <Route path="/devoluciones" element={<Devoluciones />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/terminos" element={<Terminos />} />
                      <Route path="/privacidad" element={<Privacidad />} />
                      <Route path="/login" element={<Login />} />
                       <Route path="/register" element={<Register />} />
                       <Route path="/forgot-password" element={<ForgotPassword />} />
                       <Route path="/reset-password" element={<ResetPassword />} />
                       <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/account" element={<Account />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>

                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="productos" element={<ProductsPage />} />
                      <Route path="productos/nuevo" element={<ProductFormPage />} />
                      <Route path="productos/:id/editar" element={<ProductFormPage />} />
                      <Route path="categorias" element={<CategoriesPage />} />
                      <Route path="pedidos" element={<OrdersPage />} />
                      <Route path="cupones" element={<CouponsPage />} />
                    </Route>

                    <Route path="/admin/login" element={<AdminLoginPage />} />
                  </Routes>
                </Suspense>
                <ToastContainer />
              </AdminProvider>
          </CartProvider>
          </WishlistProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
