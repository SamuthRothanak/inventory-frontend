import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function RoleRedirect() {
  const token = useAuthStore((state) => state.token);
  const can   = useAuthStore((state) => state.can);

  if (!token)                    return <Navigate to="/login" replace />;
  if (can("dashboard.view"))     return <Navigate to="/home"  replace />;
  if (can("sales.create"))       return <Navigate to="/pos"   replace />;
  return <Navigate to="/login" replace />;
}