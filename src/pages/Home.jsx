import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
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
  FiUser,
  FiShield,
  FiFileText,
  FiSettings,
  FiDatabase,
  FiActivity,
  FiRefreshCcw,
  FiLogOut,
} from "react-icons/fi";
import { useMutation } from "@tanstack/react-query";

import { logoutApi } from "../services/auth.service";
import { useAuthStore } from "../store/authStore";

const mainMenus = [
  { label: "Dashboard", icon: FiGrid, path: "/home", end: true },
  { label: "Categories", icon: FiTag, path: "/home/categories" },
  { label: "Products", icon: FiBox, path: "/home/products" },
  { label: "Suppliers", icon: FiTruck, path: "/home/suppliers" },
  { label: "Purchases", icon: FiShoppingCart, path: "/home/purchases" },
  { label: "Inventory", icon: FiArchive, path: "/home/inventory" },
  { label: "Customer", icon: FiUsers, path: "/home/customer" },
  { label: "Sales", icon: FiDollarSign, path: "/home/sales" },
  { label: "Reports", icon: FiFileText, path: "/home/reports" },
];

const adminMenus = [
  { label: "Users", icon: FiUser, path: "/home/users" },
  { label: "Role & Permission", icon: FiShield, path: "/home/roles" },
];

const systemMenus = [
  { label: "Settings", icon: FiSettings, path: "/home/settings" },
  { label: "Exchange Rate", icon: FiRefreshCcw, path: "/home/exchange-rate" },
  { label: "Backup Data", icon: FiDatabase, path: "/home/backup-data" },
  { label: "Audit Log", icon: FiActivity, path: "/home/audit-log" },
];

function MenuLink({ item, collapsed, isDark }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.end}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          "group relative flex items-center rounded-xl text-[15px] font-semibold transition-all duration-200",
          collapsed
            ? "mx-auto h-11 w-11 justify-center"
            : "h-11 w-full gap-3 px-3",
          isActive
            ? "bg-red-500 text-white shadow-sm shadow-red-500/20"
            : isDark
            ? "text-zinc-300 hover:bg-zinc-800 hover:text-white"
            : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              "flex h-6 w-6 shrink-0 items-center justify-center",
              isActive ? "text-white" : "",
            ].join(" ")}
          >
            <Icon className="text-[19px]" />
          </span>

          {!collapsed && (
            <span className="min-w-0 flex-1 truncate leading-none">
              {item.label}
            </span>
          )}
        </>
      )}
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
        type="button"
        onClick={() => setOpen(!open)}
        title={collapsed ? title : undefined}
        className={[
          "flex rounded-xl text-[15px] font-bold transition-all duration-200",
          collapsed
            ? "mx-auto h-11 w-11 items-center justify-center"
            : "h-11 w-full items-center justify-between px-3",
          isDark
            ? "text-zinc-200 hover:bg-zinc-800"
            : "text-zinc-800 hover:bg-zinc-100",
        ].join(" ")}
      >
        <div
          className={[
            "flex min-w-0 items-center",
            collapsed ? "justify-center" : "gap-3",
          ].join(" ")}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center">
            <Icon className="text-[19px]" />
          </span>

          {!collapsed && (
            <span className="min-w-0 truncate leading-none">{title}</span>
          )}
        </div>

        {!collapsed && (
          <FiChevronDown
            className={[
              "shrink-0 text-[18px] transition-transform duration-200",
              open ? "rotate-0" : "-rotate-90",
            ].join(" ")}
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

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const clearAuth = useAuthStore((state) => state.clearAuth);

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      clearAuth();
      navigate("/login", { replace: true });
    },
  });

  const [collapsed, setCollapsed] = useState(false);

  const isAdminPath = adminMenus.some(
    (item) =>
      location.pathname === item.path ||
      location.pathname.startsWith(item.path + "/")
  );

  const isSystemPath = systemMenus.some(
    (item) =>
      location.pathname === item.path ||
      location.pathname.startsWith(item.path + "/")
  );

  const [openAdmin, setOpenAdmin] = useState(isAdminPath);
  const [openSystem, setOpenSystem] = useState(isSystemPath);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    if (isAdminPath) {
      setOpenAdmin(true);
    }

    if (isSystemPath) {
      setOpenSystem(true);
    }
  }, [isAdminPath, isSystemPath]);

  const pageTitle = useMemo(() => {
    const pathname = location.pathname;

    const allMenus = [...mainMenus, ...adminMenus, ...systemMenus].sort(
      (a, b) => b.path.length - a.path.length
    );

    const found = allMenus.find(
      (item) => pathname === item.path || pathname.startsWith(item.path + "/")
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
          className={[
            "relative shrink-0 border-r transition-all duration-300",
            collapsed ? "w-[82px]" : "w-[260px]",
            theme.sidebar,
          ].join(" ")}
        >
          <div className="flex h-full flex-col overflow-hidden">
            <div className={`border-b p-3 ${theme.border}`}>
              <div
                className={[
                  "rounded-2xl border transition-all duration-300",
                  collapsed
                    ? "mx-auto flex h-[56px] w-[54px] items-center justify-center p-0"
                    : "flex min-h-[68px] items-center gap-3 px-3 py-3",
                  theme.brandBox,
                ].join(" ")}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500 text-base font-bold text-white shadow-sm">
                  L
                </div>

                {!collapsed && (
                  <div className="min-w-0 leading-tight">
                    <h2
                      className={[
                        "truncate text-base font-extrabold",
                        theme.title,
                      ].join(" ")}
                    >
                      Hak Ly Mart
                    </h2>
                    <p
                      className={[
                        "mt-1 truncate text-xs font-semibold",
                        theme.subTitle,
                      ].join(" ")}
                    >
                      Admin
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="scrollbar-hide flex-1 overflow-y-auto px-3 py-4">
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
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className={[
                  "flex items-center justify-center rounded-xl bg-red-500 text-sm font-bold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70",
                  collapsed ? "mx-auto h-11 w-11" : "h-11 w-full gap-2 px-4",
                ].join(" ")}
              >
                <FiLogOut className="text-[18px]" />

                {!collapsed && (
                  <span>
                    {logoutMutation.isPending ? "Logging out..." : "Logout"}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className={[
                "absolute -right-4 top-[92px] z-20 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition",
                theme.toggle,
              ].join(" ")}
            >
              <FiChevronLeft
                className={[
                  "text-[18px] transition-transform",
                  collapsed ? "rotate-180" : "",
                ].join(" ")}
              />
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={[
              "sticky top-0 z-10 flex h-[74px] shrink-0 items-center justify-between border-b px-6 backdrop-blur",
              theme.header,
            ].join(" ")}
          >
            <div className="min-w-0">
              <h1 className={`truncate text-2xl font-extrabold ${theme.title}`}>
                {pageTitle}
              </h1>

              <p className={`mt-0.5 text-sm ${theme.subTitle}`}>
                Management panel
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600"
              >
                <FiBell className="text-[18px]" />
              </button>

              <button
                type="button"
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