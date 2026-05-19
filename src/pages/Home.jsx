import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  FiBell,
  FiMoon,
  FiSun,
  FiChevronDown,
  FiChevronLeft,
  FiGrid,
  FiBox,
  FiTag,
  FiUsers,
  FiTruck,
  FiArchive,
  FiShoppingCart,
  FiDollarSign,
  FiClipboard,
  FiUser,
  FiShield,
  FiFileText,
  FiSettings,
  FiDatabase,
  FiActivity,
  FiLogOut,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { logoutApi } from "../services/auth.service";
import { useAuthStore } from "../store/authStore";
const mainMenus = [
  { label: "Dashboard", icon: FiGrid, path: "/home", end: true },
  { label: "Products", icon: FiBox, path: "/home/products" },
  { label: "Categories", icon: FiTag, path: "/home/categories" },
  { label: "Customer", icon: FiUsers, path: "/home/customer" },
  { label: "Suppliers", icon: FiTruck, path: "/home/suppliers" },
  { label: "Inventory", icon: FiArchive, path: "/home/inventory" },
  { label: "Purchases", icon: FiShoppingCart, path: "/home/purchases" },
  { label: "Sales", icon: FiDollarSign, path: "/home/sales" },
  // { label: "Orders", icon: FiClipboard, path: "/home/orders" },
  { label: "Reports", icon: FiFileText, path: "/home/reports" },
];

const adminMenus = [
  { label: "Users", icon: FiUser, path: "/home/users" },
  { label: "Role & Permission", icon: FiShield, path: "/home/roles" },
];

const systemMenus = [
  { label: "Settings", icon: FiSettings, path: "/home/settings" },
  { label: "Backup Data", icon: FiDatabase, path: "/home/backup-data" },
  { label: "Audit Log", icon: FiActivity, path: "/home/audit-log" },
];

function MenuLink({ item, collapsed, isDark }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.end}
      className={({ isActive }) =>
        [
          "group flex items-center rounded-xl text-sm font-medium transition-all duration-200",
          collapsed
            ? "mx-auto h-12 w-12 justify-center px-0"
            : "w-full gap-3 px-3 py-2.5",
          isActive
            ? "bg-red-500 text-white shadow-sm"
            : isDark
              ? "text-zinc-200 hover:bg-zinc-800"
              : "text-zinc-700 hover:bg-zinc-100",
        ].join(" ")
      }
    >
      <Icon className="shrink-0 text-[19px]" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

function MenuGroup({
  title,
  icon: Icon,
  items,
  open,
  setOpen,
  collapsed,
  isDark,
}) {
  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className={`flex rounded-xl text-sm font-semibold transition ${
          collapsed
            ? "mx-auto h-12 w-12 items-center justify-center"
            : "w-full items-center justify-between px-3 py-2.5"
        } ${
          isDark
            ? "text-zinc-200 hover:bg-zinc-800"
            : "text-zinc-700 hover:bg-zinc-100"
        }`}
      >
        <div
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}
        >
          <Icon className="text-[19px] shrink-0" />
          {!collapsed && <span>{title}</span>}
        </div>

        {!collapsed && (
          <FiChevronDown
            className={`shrink-0 transition-transform duration-200 ${
              open ? "rotate-0" : "-rotate-90"
            }`}
          />
        )}
      </button>

      {open && !collapsed && (
        <div className="mt-1 space-y-1 pl-2">
          {items.map((item) => (
            <MenuLink
              key={item.path}
              item={item}
              collapsed={collapsed}
              isDark={isDark}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomeLayout() {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      clearAuth();
      navigate("/login", { replace: true });
    },
  });

  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openAdmin, setOpenAdmin] = useState(true);
  const [openSystem, setOpenSystem] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const pageTitle = useMemo(() => {
    const pathname = location.pathname;
    const allMenus = [...mainMenus, ...adminMenus, ...systemMenus].sort(
      (a, b) => b.path.length - a.path.length,
    );

    const found = allMenus.find(
      (item) => pathname === item.path || pathname.startsWith(item.path + "/"),
    );

    return found ? found.label : "Dashboard";
  }, [location.pathname]);

  const theme = {
    app: isDark ? "bg-zinc-950" : "bg-zinc-100",
    sidebar: isDark
      ? "bg-zinc-900 border-zinc-800"
      : "bg-white border-zinc-200",
    brandBox: isDark
      ? "bg-zinc-950 border-zinc-800"
      : "bg-zinc-50 border-zinc-200",
    header: isDark
      ? "bg-zinc-900/95 border-zinc-800"
      : "bg-white/95 border-zinc-200",
    title: isDark ? "text-white" : "text-zinc-900",
    subTitle: isDark ? "text-zinc-400" : "text-zinc-500",
    border: isDark ? "border-zinc-800" : "border-zinc-200",
    toggle: isDark
      ? "bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
      : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50",
    contentWrap: isDark ? "bg-zinc-950" : "bg-zinc-100",
  };

  return (
    <div className={`h-screen overflow-hidden ${theme.app}`}>
      <div className="flex h-full">
        <aside
          className={`relative shrink-0 border-r transition-all duration-300 ${
            collapsed ? "w-[88px]" : "w-[270px]"
          } ${theme.sidebar}`}
        >
          <div className="flex h-full flex-col overflow-hidden">
            {/* Logo */}
            <div className={`border-b p-3 ${theme.border}`}>
              <div
                className={`rounded-2xl border p-3 ${
                  collapsed
                    ? "mx-auto flex h-[60px] w-[56px] items-center justify-center"
                    : "flex items-center gap-3"
                } ${theme.brandBox}`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white font-bold">
                  L
                </div>

                {!collapsed && (
                  <div className="min-w-0 leading-tight">
                    <h2
                      className={`truncate text-base font-bold ${theme.title}`}
                    >
                      Hak Ly Mart
                    </h2>
                    <p className={`text-xs font-medium ${theme.subTitle}`}>
                      Admin
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="scrollbar-hide flex-1 overflow-y-auto px-2 py-3">
              <div className="space-y-1">
                {mainMenus.map((item) => (
                  <MenuLink
                    key={item.path}
                    item={item}
                    collapsed={collapsed}
                    isDark={isDark}
                  />
                ))}
              </div>

              <MenuGroup
                title="Administration"
                icon={FiShield}
                items={adminMenus}
                open={openAdmin}
                setOpen={setOpenAdmin}
                collapsed={collapsed}
                isDark={isDark}
              />

              <MenuGroup
                title="System"
                icon={FiSettings}
                items={systemMenus}
                open={openSystem}
                setOpen={setOpenSystem}
                collapsed={collapsed}
                isDark={isDark}
              />
            </div>

            <div className={`border-t p-3 ${theme.border}`}>
              {/* Logout */}
              <button
                onClick={() => logoutMutation.mutate()}
                className={`flex items-center justify-center rounded-xl bg-red-500 text-sm font-semibold text-white transition hover:bg-red-600 ${
                  collapsed ? "mx-auto h-12 w-12" : "w-full gap-2 px-4 py-3"
                }`}
              >
                <FiLogOut className="text-[18px]" />
                {!collapsed && <span>Logout</span>}
              </button>
            </div>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`absolute -right-4 top-18 z-20 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition ${theme.toggle}`}
            >
              <FiChevronLeft
                className={`${collapsed ? "rotate-180" : ""} transition-transform`}
              />
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={`sticky top-0 z-10 flex h-[74px] shrink-0 items-center justify-between border-b px-6 backdrop-blur ${theme.header}`}
          >
            <div className="min-w-0">
              <h1 className={`truncate text-2xl font-bold ${theme.title}`}>
                {pageTitle}
              </h1>
              <p className={`text-sm ${theme.subTitle}`}>Management panel</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600">
                <FiBell className="text-[18px]" />
              </button>

              <button
                onClick={() => setIsDark((prev) => !prev)}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600"
              >
                {isDark ? (
                  <FiSun className="text-[18px]" />
                ) : (
                  <FiMoon className="text-[18px]" />
                )}
              </button>
            </div>
          </header>

          <main className={`flex-1 overflow-y-auto ${theme.contentWrap}`}>
            <div className="p-6">
              <div className="mx-auto w-full max-w-7xl">
                <Outlet context={{ isDark }} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
