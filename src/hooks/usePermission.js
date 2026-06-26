import { useAuthStore } from "../store/authStore";

export function usePermission(permission) {
  return useAuthStore((s) => s.can(permission));
}

export function usePermissionAny(permissions) {
  return useAuthStore((s) => s.canAny(permissions));
}

export function useRole(role) {
  return useAuthStore((s) => s.hasRole(role));
}
