import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { resolveLandingPath } from "../utils/landingPath";

export default function RoleRedirect() {
  const token = useAuthStore((state) => state.token);
  const can   = useAuthStore((state) => state.can);

  if (!token) return <Navigate to="/login" replace />;
  return <Navigate to={resolveLandingPath(can)} replace />;
}