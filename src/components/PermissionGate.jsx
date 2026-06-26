import { useAuthStore } from "../store/authStore";

export default function PermissionGate({ permission, fallback = null, children }) {
  const can = useAuthStore((s) => s.can(permission));
  return can ? children : fallback;
}
