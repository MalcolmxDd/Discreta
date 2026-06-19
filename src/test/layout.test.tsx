import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { ToastProvider } from "../context/ToastContext";
import Layout from "../components/Layout";
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

describe("Layout", () => {
  beforeEach(() => {
    localStorage.clear();
  })

  it('renders logo link', () => {
    render(<Layout />, { wrapper })
    const brandText = screen.getByText('DiscretaStore')
    expect(brandText).toBeDefined()
    const headerLink = brandText.closest('a')
    expect(headerLink?.getAttribute('href')).toBe('/')
  })

  it('renders navigation links', () => {
    render(<Layout />, { wrapper })
    expect(screen.getByText('Inicio')).toBeDefined()
    // These appear in nav + footer, use getAllByText
    expect(screen.getAllByText('Productos').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Nosotros').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('Contacto').length).toBeGreaterThanOrEqual(2)
  })

  it('renders footer brand', () => {
    render(<Layout />, { wrapper })
    const footerLogo = screen.getByAltText('DiscretaStore')
    expect(footerLogo).toBeDefined()
    expect(footerLogo?.closest('a')?.getAttribute('href')).toBe('/')
  })

  it('renders footer help links', () => {
    render(<Layout />, { wrapper })
    expect(screen.getByText('Envíos')).toBeDefined()
    expect(screen.getByText('Devoluciones')).toBeDefined()
    expect(screen.getByText('FAQ')).toBeDefined()
  })

  it('renders footer legal links', () => {
    render(<Layout />, { wrapper })
    expect(screen.getByText('Términos')).toBeDefined()
    expect(screen.getByText('Privacidad')).toBeDefined()
  })

  it('renders theme toggle button', () => {
    render(<Layout />, { wrapper })
    const toggle = screen.getByLabelText('Alternar tema')
    expect(toggle).toBeDefined()
  })

  it('renders search input', () => {
    render(<Layout />, { wrapper })
    const search = screen.getByLabelText('Buscar productos')
    expect(search).toBeDefined()
  })

  it('renders cart link', () => {
    render(<Layout />, { wrapper })
    const cartLink = screen.getByTitle('Carrito')
    expect(cartLink).toBeDefined()
  })

  it('renders login link', () => {
    render(<Layout />, { wrapper })
    const loginLink = screen.getByTitle('Iniciar sesión')
    expect(loginLink).toBeDefined()
  })
})
