import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { WishlistContextType } from "../types";
import { useAuth } from "./AuthContext";
import { fetchWishlistProducts, addWishlistItem, removeWishlistItem } from "../api/wishlist";

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = "discretastore-wishlist";

function loadWishlist(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWishlist(favorites: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    /* storage full */
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const prevAuth = useRef(isAuthenticated);

  const [favorites, setFavorites] = useState<string[]>(() => {
    if (isAuthenticated) return [];
    return loadWishlist();
  });

  const [synced, setSynced] = useState(false);

  // Fetch server wishlist when user logs in
  useEffect(() => {
    if (isAuthenticated && !synced) {
      const localFavs = loadWishlist();

      fetchWishlistProducts()
        .then((products) => {
          const serverIds = products.map((p) => p.id);
          const merged = [...new Set([...serverIds, ...localFavs])];

          setFavorites(merged);

          const localOnly = localFavs.filter((id) => !serverIds.includes(id));
          Promise.allSettled(localOnly.map((id) => addWishlistItem(id).catch(() => {})))
            .then(() => {
              setSynced(true);
              saveWishlist(merged);
            });
        })
        .catch(() => {
          setFavorites(localFavs);
          setSynced(true);
        });
    }
  }, [isAuthenticated, synced]);

  // Detect logout
  useEffect(() => {
    if (prevAuth.current && !isAuthenticated) {
      setFavorites(loadWishlist());
      setSynced(false);
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated]);

  // Persist to localStorage for guest continuity
  useEffect(() => {
    if (!isAuthenticated) {
      saveWishlist(favorites);
    }
  }, [favorites, isAuthenticated]);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(productId);
      const next = isFav
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];

      if (isAuthenticated) {
        const action = isFav ? removeWishlistItem : addWishlistItem;
        action(productId).catch(() => {
          // Revert on failure
          setFavorites(prev);
        });
      } else {
        saveWishlist(next);
      }

      return next;
    });
  }, [isAuthenticated]);

  const isFavorite = useCallback(
    (productId: string) => favorites.includes(productId),
    [favorites]
  );

  return (
    <WishlistContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
