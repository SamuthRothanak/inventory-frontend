import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { resolveLandingPath } from "../utils/landingPath";

export default function ProtectedRoute({ allowedRoles = [], requiredPermission = null, requireAnyPermission = false, children }) {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const roles = useAuthStore((state) => state.roles);
  const permissions = useAuthStore((state) => state.permissions);
  const can   = useAuthStore((state) => state.can);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const noAccess =
    (requiredPermission !== null && !can(requiredPermission)) ||
    (requiredPermission === null && requireAnyPermission && permissions.length === 0) ||
    (requiredPermission === null && !requireAnyPermission && allowedRoles.length > 0 && !allowedRoles.some((role) => roles.includes(role)));

  if (noAccess) {
    return <Navigate to={resolveLandingPath(can)} replace />;
  }

  return children;
}