import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const roles = useAuthStore((state) => state.roles);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some((role) => roles.includes(role));

    if (!hasAccess) {
      if (roles.includes("admin")) {
        return <Navigate to="/home" replace />;
      }

      if (roles.includes("cashier")) {
        return <Navigate to="/pos" replace />;
      }

      return <Navigate to="/login" replace />;
    }
  }

  return children;
}