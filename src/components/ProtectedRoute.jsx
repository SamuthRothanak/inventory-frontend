import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute({ allowedRoles = [], requiredPermission = null, children }) {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const roles = useAuthStore((state) => state.roles);
  const can   = useAuthStore((state) => state.can);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const noAccess =
    (requiredPermission !== null && !can(requiredPermission)) ||
    (requiredPermission === null && allowedRoles.length > 0 && !allowedRoles.some((role) => roles.includes(role)));

  if (noAccess) {
    if (can("dashboard.view")) return <Navigate to="/home" replace />;
    if (can("sales.create"))   return <Navigate to="/pos"  replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}