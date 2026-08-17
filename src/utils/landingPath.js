// Where to send a user right after login / whenever they land somewhere they can't access.
// "dashboard.view" used to double as "can enter the admin panel at all" (the /home route
// wrapper's sole gate) as well as gating the Dashboard page itself — a role with real view
// permissions (products.view, inventory-batches.view, ...) but no dashboard.view got bounced
// straight back to /login with a successful-but-invisible login, since none of the 3 places that
// computed a landing page (Login.jsx, ProtectedRoute.jsx, RoleRedirect.jsx) had any fallback
// beyond dashboard.view -> /pos -> /login. This resolves a real landing page from whatever
// permissions the user actually has, in the same priority order as the sidebar.
export function resolveLandingPath(can) {
  if (can("dashboard.view")) return "/home";
  if (can("sales.view")) return "/home/sales";
  if (can("purchases.view")) return "/home/purchases";
  if (can("products.view")) return "/home/products";
  if (can("stock-balances.view") || can("inventory-batches.view")) return "/home/inventory";
  if (can("customers.view")) return "/home/customer";
  if (can("suppliers.view")) return "/home/suppliers";
  if (can("categories.view")) return "/home/categories";
  if (can("reports.sales")) return "/home/reports";
  if (can("users.view")) return "/home/users";
  if (can("roles.view")) return "/home/roles";
  if (can("audit-log.view")) return "/home/audit-log";
  if (can("sales.create")) return "/pos";
  return "/login";
}
