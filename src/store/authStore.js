import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const normalizeNames = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") return item.name;
      return null;
    })
    .filter(Boolean);
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      tokenType: "Bearer",
      user: null,
      roles: [],
      permissions: [],

      setAuth: ({ token, tokenType = "Bearer", user, roles = [], permissions = [] }) =>
        set({
          token,
          tokenType,
          user,
          roles: normalizeNames(roles),
          permissions: normalizeNames(permissions),
        }),

      clearAuth: () =>
        set({
          token: null,
          tokenType: "Bearer",
          user: null,
          roles: [],
          permissions: [],
        }),

      hasRole: (role) => get().roles.includes(role),
      can:     (permission) => get().permissions.includes(permission),
      canAny:  (perms) => perms.some((p) => get().permissions.includes(p)),
    }),
    {
      name: "inventory-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);