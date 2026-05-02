export const capitalize = (value = "") =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

export const getRoleName = (user) => {
  if (Array.isArray(user?.roles) && user.roles.length > 0) {
    const firstRole = user.roles[0];

    if (typeof firstRole === "string") return firstRole.toLowerCase();

    if (typeof firstRole === "object" && firstRole?.name) {
      return firstRole.name.toLowerCase();
    }
  }

  if (typeof user?.role === "string") return user.role.toLowerCase();

  if (typeof user?.role === "object" && user?.role?.name) {
    return user.role.name.toLowerCase();
  }

  return "staff";
};

export const getStatusLabel = (user) => {
  const rawStatus = String(user?.status || "active").toLowerCase();
  return rawStatus === "inactive" ? "Inactive" : "Active";
};

export const extractUsers = (response) => {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.users)) return payload.users;

  return [];
};