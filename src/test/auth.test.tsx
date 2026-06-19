import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn((url: string) => {
    if (url.includes("/api/auth/login")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            token: "mock-jwt-token-123",
            user: { id: "usr-001", name: "Pablo", email: "pablo@test.cl", role: "user" },
          },
        }),
      });
    }
    if (url.includes("/api/auth/register")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            token: "mock-jwt-token-456",
            user: { id: "usr-002", name: "Pablo", email: "pablo@test.cl", role: "user" },
          },
        }),
      });
    }
    if (url.includes("/api/auth/me")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { id: "usr-001", name: "Pablo", email: "pablo@test.cl", role: "user" },
        }),
      });
    }
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: "Not found" }),
    });
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AuthContext", () => {
  describe("starts unauthenticated", () => {
    it("starts with no user", () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe("register", () => {
    it("registers a new user", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        const res = await result.current.register("Pablo", "pablo@test.cl", "Password1");
        expect(res.success).toBe(true);
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.name).toBe("Pablo");
      expect(result.current.user?.email).toBe("pablo@test.cl");
    });

    it("stores token in localStorage", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await result.current.register("Pablo", "pablo@test.cl", "Password1");
      });
      expect(localStorage.getItem("discretastore-auth-token")).toBe("mock-jwt-token-456");
    });
  });

  describe("login", () => {
    it("logs in with correct credentials", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        const res = await result.current.login("pablo@test.cl", "Password1");
        expect(res.success).toBe(true);
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe("pablo@test.cl");
    });

    it("handles API errors", async () => {
      vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Email o contraseña incorrectos" }),
      })));

      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        const res = await result.current.login("bad@test.cl", "wrong");
        expect(res.success).toBe(false);
        expect(res.error).toContain("incorrectos");
      });
    });
  });

  describe("logout", () => {
    it("logs out and clears user", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await result.current.register("Pablo", "pablo@test.cl", "Password1");
      });
      expect(result.current.isAuthenticated).toBe(true);
      act(() => {
        result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it("removes token from localStorage on logout", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });
      await act(async () => {
        await result.current.register("Pablo", "pablo@test.cl", "Password1");
      });
      expect(localStorage.getItem("discretastore-auth-token")).not.toBeNull();
      act(() => {
        result.current.logout();
      });
      expect(localStorage.getItem("discretastore-auth-token")).toBeNull();
    });
  });

  describe("persistence across renders", () => {
    it("restores session from token", async () => {
      localStorage.setItem("discretastore-auth-token", "existing-token");
      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
      expect(result.current.user?.name).toBe("Pablo");
    });
  });
});
