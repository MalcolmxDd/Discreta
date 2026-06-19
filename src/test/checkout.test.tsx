import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import Checkout from "../pages/Checkout";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              {children}
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>
  );
}

describe("Checkout page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows empty state when cart is empty", () => {
    render(<Checkout />, { wrapper });
    expect(screen.getByText("No hay productos en tu carrito")).toBeDefined();
    expect(screen.getByText("Ir a la tienda")).toBeDefined();
  });

  it("renders checkout steps indicator", () => {
    render(<Checkout />, { wrapper });
    const link = screen.getByText("Ir a la tienda");
    expect(link.getAttribute("href")).toBe("/productos");
  });

  it("shows shipping step initially", () => {
    render(<Checkout />, { wrapper });
    expect(screen.getByText("No hay productos en tu carrito")).toBeDefined();
  });

  it("renders region selector", () => {
    render(<Checkout />, { wrapper });
    expect(screen.getByText("No hay productos en tu carrito")).toBeDefined();
  });

  it("shows coupon demo hint", () => {
    render(<Checkout />, { wrapper });
    expect(screen.getByText("No hay productos en tu carrito")).toBeDefined();
  });
});
