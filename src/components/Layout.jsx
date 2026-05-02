import { Link, useLocation } from "react-router-dom";

function NavItem({ to, label }) {
  const { pathname } = useLocation();
  const active = pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
        active ? "bg-slate-100 font-medium" : "hover:bg-slate-50"
      }`}
    >
      {label}
    </Link>
  );
}

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <aside className="w-64 bg-white border-r min-h-screen p-4">
          <div className="font-bold mb-4">Laravel Starter Kit</div>
          <nav className="space-y-1">
            <NavItem to="/users" label="Users" />
            <NavItem to="/roles" label="Roles" />
          </nav>
        </aside>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
