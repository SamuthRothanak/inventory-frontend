import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function RoleRedirect() {
  const token = useAuthStore((state) => state.token);
  const roles = useAuthStore((state) => state.roles);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (roles.includes("admin")) {
    return <Navigate to="/home" replace />;
  }

  if (roles.includes("cashier")) {
    return <Navigate to="/pos" replace />;
  }

  return <Navigate to="/login" replace />;
}