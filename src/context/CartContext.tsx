import { CART_MAX_QUANTITY } from "../constants";
import { createContext, useContext, useReducer, useState, useEffect, useRef, type ReactNode } from "react";
import type { CartItem, Product, CartContextType } from "../types";
import { useAuth } from "./AuthContext";
import { fetchCartItems, syncCart } from "../api/cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

type Action =
  | { type: "ADD_ITEM"; product: Product; quantity: number }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "UPDATE_QUANTITY"; productId: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "LOAD"; items: CartItem[] };

function cartReducer(state: CartItem[], action: Action): CartItem[] {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.find((i) => i.product.id === action.product.id);
      if (existing) {
        return state.map((i) =>
          i.product.id === action.product.id
            ? { ...i, quantity: Math.min(i.quantity + action.quantity, CART_MAX_QUANTITY) }
            : i
        );
      }
      return [...state, { product: action.product, quantity: action.quantity }];
    }
    case "REMOVE_ITEM":
      return state.filter((i) => i.product.id !== action.productId);
    case "UPDATE_QUANTITY":
      if (action.quantity <= 0) {
        return state.filter((i) => i.product.id !== action.productId);
      }
      return state.map((i) =>
        i.product.id === action.productId ? { ...i, quantity: Math.min(action.quantity, CART_MAX_QUANTITY) } : i
      );
    case "CLEAR":
      return [];
    case "LOAD":
      return action.items;
    default:
      return state;
  }
}

const STORAGE_KEY = "discretastore-cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* storage full */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const prevAuth = useRef(isAuthenticated);

  const [items, dispatch] = useReducer(cartReducer, [], () => {
    if (isAuthenticated) return [];
    return loadCart();
  });

  const [synced, setSynced] = useState(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch server cart when user logs in (merge with local)
  useEffect(() => {
    if (isAuthenticated && !synced) {
      const localItems = loadCart();

      fetchCartItems()
        .then((serverData) => {
          const serverCart: CartItem[] = Array.isArray(serverData)
            ? serverData.map((p: any) => ({
                product: {
                  id: p.id as string,
                  name: p.name as string,
                  slug: p.slug as string,
                  description: p.description as string,
                  longDescription: (p.long_description as string) || '',
                  price: p.price as number,
                  originalPrice: (p.original_price as number) ?? undefined,
                  images: (p.images as string[]) || [],
                  gradient: p.gradient as string,
                  category: p.category as string,
                  tags: p.tags as string[],
                  rating: p.rating as number,
                  inStock: p.in_stock as boolean,
                  stockCount: p.stock_count as number,
                  features: p.features as string[],
                },
                quantity: p.quantity as number,
              }))
            : [];

          // Merge: items from server + items from local (add local that aren't in server)
          const serverIds = new Set(serverCart.map((i) => i.product.id));
          const merged = [...serverCart];

          for (const local of localItems) {
            if (!serverIds.has(local.product.id)) {
              merged.push(local);
            }
          }

          dispatch({ type: "LOAD", items: merged });

          // Sync merged cart to server
          const payload = merged.map((i) => ({ product_id: i.product.id, quantity: i.quantity }));
          syncCart(payload).catch(() => {})                .finally(() => setSynced(true));
        })
        .catch(() => {
          // API failed, use local
          dispatch({ type: "LOAD", items: loadCart() });
          setSynced(true);
        });
    }
  }, [isAuthenticated, synced]);

  // Detect logout
  useEffect(() => {
    if (prevAuth.current && !isAuthenticated) {
      dispatch({ type: "LOAD", items: loadCart() });
      setSynced(false);
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  // Persist to localStorage for guest
  useEffect(() => {
    if (!isAuthenticated) {
      saveCart(items);
    }
  }, [items, isAuthenticated]);

  // Sync to server after changes (debounced) when authenticated
  const syncToServer = (currentItems: CartItem[]) => {
    if (!isAuthenticated) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      const payload = currentItems.map((i) => ({ product_id: i.product.id, quantity: i.quantity }));
      syncCart(payload).catch(() => {});
    }, 1000);
  };

  const addItem = (product: Product, quantity = 1) => {
    dispatch({ type: "ADD_ITEM", product, quantity });
    // Need to compute next state for sync - use the dispatch value
    const prev = items;
    const existing = prev.find((i) => i.product.id === product.id);
    let next: CartItem[];
    if (existing) {
      next = prev.map((i) =>
        i.product.id === product.id
          ? { ...i, quantity: Math.min(i.quantity + quantity, CART_MAX_QUANTITY) }
          : i
      );
    } else {
      next = [...prev, { product, quantity: Math.min(quantity, CART_MAX_QUANTITY) }];
    }
    syncToServer(next);
  };

  const removeItem = (productId: string) => {
    dispatch({ type: "REMOVE_ITEM", productId });
    syncToServer(items.filter((i) => i.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", productId, quantity });
    if (quantity <= 0) {
      syncToServer(items.filter((i) => i.product.id !== productId));
    } else {
      syncToServer(items.map((i) =>
        i.product.id === productId ? { ...i, quantity: Math.min(quantity, CART_MAX_QUANTITY) } : i
      ));
    }
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR" });
    if (isAuthenticated) {
      syncCart([]).catch(() => {});
    }
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
