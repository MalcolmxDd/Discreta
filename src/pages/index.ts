// Critical pages (direct imports)
export { default as Home } from "./Home";
export { default as Products } from "./Products";
export { default as ProductDetail } from "./ProductDetail";
export { default as Cart } from "./Cart";

// Admin pages (re-export from Admin barrel)
export {
  AdminLayout,
  Dashboard,
  ProductsPage,
  ProductFormPage,
  CategoriesPage,
  OrdersPage,
  CouponsPage,
  AdminLoginPage,
} from "./Admin";
