import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
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
  FiKey,
  FiFileText,
  FiSettings,
  FiSliders,
  FiDatabase,
  FiActivity,
  FiRefreshCcw,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useMutation } from "@tanstack/react-query";

import { logoutApi } from "../services/auth.service";
import { useAuthStore } from "../store/authStore";
import NotificationBell from "./Admin/Notifications/components/NotificationBell";
import {
  getShopInitials,
  getStoredShopInfo,
  SHOP_INFO_UPDATED_EVENT,
} from "../utils/shopInfo";

const mainMenus = [
  { label: "ផ្ទាំងគ្រប់គ្រង",       icon: FiGrid,         path: "/home", end: true,     permission: "dashboard.view" },
  { label: "ប្រភេទទំនិញ",           icon: FiTag,          path: "/home/categories",     permission: "categories.view" },
  { label: "គ្រប់គ្រងផលិតផល",       icon: FiBox,          path: "/home/products",       permission: "products.view" },
  { label: "គ្រប់គ្រងអ្នកផ្គត់ផ្គង់", icon: FiTruck,        path: "/home/suppliers",      permission: "suppliers.view" },
  { label: "គ្រប់គ្រងការទិញ",       icon: FiShoppingCart, path: "/home/purchases",      permission: "purchases.view" },
  { label: "គ្រប់គ្រងស្តុក",         icon: FiArchive,      path: "/home/inventory",      permission: "stock.view" },
  { label: "គ្រប់គ្រងអតិថិជន",       icon: FiUsers,        path: "/home/customer",       permission: "customers.view" },
  { label: "គ្រប់គ្រងការលក់",       icon: FiDollarSign,   path: "/home/sales",          permission: "sales.view" },
  { label: "របាយការណ៍",             icon: FiFileText,     path: "/home/reports",        permission: "reports.sales" },
];

const adminMenus = [
  { label: "អ្នកប្រើប្រាស់",  icon: FiUser,   path: "/home/users", permission: "users.view" },
  { label: "តួនាទី & សិទ្ធិ", icon: FiKey, path: "/home/roles", permission: "roles.view" },
];

const systemMenus = [
  { label: "ការកំណត់",          icon: FiSettings,   path: "/home/settings",       permission: "settings.view" },
  { label: "អត្រាប្តូរប្រាក់",  icon: FiRefreshCcw, path: "/home/exchange-rate",  permission: "exchange-rate.view" },
  { label: "បម្រុងទុកទិន្ន័យ", icon: FiDatabase,   path: "/home/backup-data",    permission: "backups.view" },
  { label: "កំណត់ហេតុ",         icon: FiActivity,   path: "/home/audit-log",      permission: "audit-log.view" },
];

function MenuLink({ item, collapsed, isDark, onNavigate }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onNavigate}
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
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border transition-all duration-200",
              isActive
                ? "border-white/25 bg-gradient-to-br from-white/25 to-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_8px_rgba(127,29,29,0.24)]"
                : isDark
                  ? "border-white/10 bg-gradient-to-br from-zinc-700 to-zinc-900 text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_8px_rgba(0,0,0,0.28)] group-hover:border-white/15 group-hover:text-white"
                  : "border-white bg-gradient-to-br from-white to-zinc-100 text-zinc-600 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_9px_rgba(24,24,27,0.16)] group-hover:text-red-500",
            ].join(" ")}
          >
            <Icon className="text-[18px] drop-shadow-sm" />
          </span>

          {!collapsed && (
            <span className="min-w-0 flex-1 truncate leading-snug pb-1">
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
  icon,
  items,
  open,
  setOpen,
  collapsed,
  isDark,
}) {
  const GroupIcon = icon;
  const groupLocation = useLocation();
  const buttonRef = useRef(null);
  const [flyoutPosition, setFlyoutPosition] = useState({ left: 92, top: 0 });
  const isGroupActive = items.some(
    (item) =>
      groupLocation.pathname === item.path ||
      groupLocation.pathname.startsWith(item.path + "/"),
  );

  return (
    <div className="mt-4">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (collapsed) {
            const rect = buttonRef.current?.getBoundingClientRect();
            if (rect) {
              const estimatedHeight = 52 + items.length * 48;
              setFlyoutPosition({
                left: rect.right + 10,
                top: Math.max(8, Math.min(rect.top, window.innerHeight - estimatedHeight - 8)),
              });
            }
            setOpen(!open);
            return;
          }

          setOpen(!open);
        }}
        title={collapsed ? title : undefined}
        className={[
          "flex rounded-xl text-[15px] font-bold transition-all duration-200",
          collapsed
            ? "mx-auto h-11 w-11 items-center justify-center"
            : "h-11 w-full items-center justify-between px-3",
          isGroupActive
            ? "bg-red-500 text-white shadow-sm shadow-red-500/20"
            : isDark
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
          <span
            className={[
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border transition-all duration-200",
              isGroupActive
                ? "border-white/25 bg-gradient-to-br from-white/25 to-white/5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_8px_rgba(127,29,29,0.24)]"
                : isDark
                  ? "border-white/10 bg-gradient-to-br from-zinc-700 to-zinc-900 text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_8px_rgba(0,0,0,0.28)]"
                  : "border-white bg-gradient-to-br from-white to-zinc-100 text-zinc-600 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_9px_rgba(24,24,27,0.16)]",
            ].join(" ")}
          >
            <GroupIcon className="text-[18px] drop-shadow-sm" />
          </span>

          {!collapsed && (
            <span className="min-w-0 truncate leading-snug pb-1">{title}</span>
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

      {open && collapsed && createPortal(
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] cursor-default bg-transparent"
          />
          <div
            className={`fixed z-[70] w-64 rounded-2xl border p-2 shadow-2xl ${
              isDark
                ? "border-white/10 bg-zinc-900 text-white shadow-black/40"
                : "border-zinc-200 bg-white text-zinc-900 shadow-zinc-300/60"
            }`}
            style={{ left: flyoutPosition.left, top: flyoutPosition.top }}
          >
            <p className={`px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wide ${
              isDark ? "text-zinc-400" : "text-zinc-500"
            }`}>
              {title}
            </p>
            <div className="space-y-1">
              {items.map((item) => (
                <MenuLink
                  key={item.path}
                  item={item}
                  collapsed={false}
                  isDark={isDark}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </div>
          </div>
        </>,
        document.body,
      )}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const clearAuth = useAuthStore((state) => state.clearAuth);
  const can       = useAuthStore((state) => state.can);

  const visibleMain   = mainMenus.filter((m) => can(m.permission));
  const visibleAdmin  = adminMenus.filter((m) => can(m.permission));
  const visibleSystem = systemMenus.filter((m) => can(m.permission));

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSettled: () => {
      clearAuth();
      navigate("/login", { replace: true });
    },
  });

  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [shopInfo, setShopInfo] = useState(() => getStoredShopInfo());

  const isAdminPath = adminMenus.some(
    (item) =>
      location.pathname === item.path ||
      location.pathname.startsWith(item.path + "/"),
  );

  const isSystemPath = systemMenus.some(
    (item) =>
      location.pathname === item.path ||
      location.pathname.startsWith(item.path + "/"),
  );

  const [openAdmin, setOpenAdmin] = useState(isAdminPath);
  const [openSystem, setOpenSystem] = useState(isSystemPath);

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";

    return () => {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "";
    };
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const closeTimer = window.setTimeout(() => setMobileSidebarOpen(false), 0);
    return () => window.clearTimeout(closeTimer);
  }, [location.pathname]);

  useEffect(() => {
    const syncShopInfo = (event) => {
      setShopInfo(event.detail ?? getStoredShopInfo());
    };

    window.addEventListener(SHOP_INFO_UPDATED_EVENT, syncShopInfo);
    window.addEventListener("storage", syncShopInfo);

    return () => {
      window.removeEventListener(SHOP_INFO_UPDATED_EVENT, syncShopInfo);
      window.removeEventListener("storage", syncShopInfo);
    };
  }, []);

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
      (a, b) => b.path.length - a.path.length,
    );

    const found = allMenus.find(
      (item) => pathname === item.path || pathname.startsWith(item.path + "/"),
    );

    return found ? found.label : "ផ្ទាំងគ្រប់គ្រង";
  }, [location.pathname]);

  const theme = {
    app: isDark ? "bg-zinc-950" : "bg-zinc-100",

    sidebar: isDark
      ? "bg-zinc-900 border-zinc-800"
      : "bg-white border-zinc-200",

    brandBox: isDark
      ? "border-zinc-800 bg-zinc-950 shadow-[0_5px_14px_rgba(0,0,0,0.18)]"
      : "border-zinc-200/80 bg-zinc-50 shadow-[0_5px_14px_rgba(24,24,27,0.07)]",

    header: isDark
      ? "border-zinc-800 bg-zinc-900/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.18)]"
      : "border-zinc-200 bg-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_12px_rgba(24,24,27,0.06)]",

    title: isDark ? "text-white" : "text-zinc-900",
    subTitle: isDark ? "text-zinc-400" : "text-zinc-500",
    border: isDark ? "border-zinc-800" : "border-zinc-200",

    toggle: isDark
      ? "bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
      : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50",

    contentWrap: isDark ? "bg-zinc-950" : "bg-zinc-100",
  };
  const sidebarCollapsed = collapsed && !mobileSidebarOpen;

  return (
    <div className={`h-screen overflow-hidden ${theme.app}`}>
      <div className="flex h-full">
        {mobileSidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] lg:hidden"
          />
        )}

        <aside
          className={[
            "fixed inset-y-0 left-0 z-50 w-[min(300px,86vw)] shrink-0 border-r transition-all duration-300 lg:relative lg:z-auto",
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            collapsed ? "lg:w-[82px]" : "lg:w-[260px]",
            theme.sidebar,
          ].join(" ")}
        >
          <div className="flex h-full flex-col overflow-hidden">
            <div className={`border-b p-3 ${theme.border}`}>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileSidebarOpen(false)}
                className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl border lg:hidden ${theme.toggle}`}
              >
                <FiX className="text-xl" />
              </button>

              <div
                className={[
                  "rounded-2xl border transition-all duration-300",
                  sidebarCollapsed
                    ? "mx-auto flex h-[52px] w-[52px] items-center justify-center p-0"
                    : "flex min-h-[62px] items-center gap-3 px-3 py-2",
                  theme.brandBox,
                ].join(" ")}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-300/50 bg-gradient-to-br from-red-400 via-red-500 to-red-600 text-base font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_5px_10px_rgba(239,68,68,0.28)]">
                  {getShopInitials(shopInfo.name)}
                </div>

                {!sidebarCollapsed && (
                  <div className="min-w-0 leading-tight">
                    <h2
                      className={[
                        "truncate text-base font-extrabold",
                        theme.title,
                      ].join(" ")}
                    >
                      {shopInfo.name || "Hak Ley Mart"}
                    </h2>
                    <p
                      className={[
                        "mt-1 truncate text-xs font-semibold",
                        theme.subTitle,
                      ].join(" ")}
                    >
                      {shopInfo.khmerName || "ហាក់ ឡេ ម៉ាត"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="scrollbar-hide flex-1 overflow-y-auto px-3 py-4">
              <div className="space-y-1">
                {visibleMain.map((item) => (
                  <MenuLink
                    key={item.path}
                    item={item}
                    collapsed={sidebarCollapsed}
                    isDark={isDark}
                  />
                ))}
              </div>

              {visibleAdmin.length > 0 && (
                <MenuGroup
                  title="គ្រប់គ្រងអ្នកប្រើ"
                  icon={FiShield}
                  items={visibleAdmin}
                  open={openAdmin}
                  setOpen={setOpenAdmin}
                  collapsed={sidebarCollapsed}
                  isDark={isDark}
                />
              )}

              {visibleSystem.length > 0 && (
                <MenuGroup
                  title="ប្រព័ន្ធ"
                  icon={FiSliders}
                  items={visibleSystem}
                  open={openSystem}
                  setOpen={setOpenSystem}
                  collapsed={sidebarCollapsed}
                  isDark={isDark}
                />
              )}
            </div>

            <div className={`border-t p-3 ${theme.border}`}>
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className={[
                  "group flex items-center justify-center rounded-xl border text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70",
                  sidebarCollapsed ? "mx-auto h-11 w-11" : "h-11 w-full gap-2 px-4",
                  isDark
                    ? "border-red-500/20 bg-gradient-to-br from-zinc-800 to-zinc-900 text-red-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_10px_rgba(0,0,0,0.22)] hover:border-red-500 hover:bg-none hover:bg-red-500 hover:text-white"
                    : "border-red-200 bg-gradient-to-br from-white to-red-50/60 text-red-500 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_10px_rgba(24,24,27,0.09)] hover:border-red-500 hover:bg-none hover:bg-red-500 hover:text-white hover:shadow-[0_5px_12px_rgba(239,68,68,0.22)]",
                ].join(" ")}
              >
                <FiLogOut className="text-[18px]" />

                {!sidebarCollapsed && (
                  <span>
                    {logoutMutation.isPending ? "កំពុងចេញ..." : "ចេញ"}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className={[
                "absolute -right-4 top-[74px] z-50 hidden h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 lg:flex",
                isDark
                  ? "border-white/10 bg-gradient-to-br from-zinc-700 to-zinc-900 text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_4px_10px_rgba(0,0,0,0.32)] hover:border-red-400/40 hover:text-red-400"
                  : "border-white bg-gradient-to-br from-white to-zinc-100 text-zinc-600 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_10px_rgba(24,24,27,0.14)] hover:border-red-200 hover:text-red-500 hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_5px_12px_rgba(239,68,68,0.16)]",
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
              "sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b px-3 backdrop-blur sm:h-[68px] sm:px-4 lg:px-6",
              theme.header,
            ].join(" ")}
          >
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setMobileSidebarOpen(true)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border lg:hidden ${theme.toggle}`}
              >
                <FiMenu className="text-xl" />
              </button>

              <h1
                className={`truncate pb-1 text-lg font-extrabold leading-snug sm:text-xl ${
                  isDark
                    ? "[text-shadow:0_-1px_0_rgba(255,255,255,0.10),0_2px_2px_rgba(0,0,0,0.55)]"
                    : "[text-shadow:0_-1px_0_rgba(255,255,255,1),0_2px_2px_rgba(24,24,27,0.18)]"
                } ${theme.title}`}
              >
                {pageTitle}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <NotificationBell isDark={isDark} />

              <button
                type="button"
                onClick={() => setIsDark((prev) => !prev)}
                className="group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[14px] border border-red-400/40 bg-gradient-to-br from-[#ff4655] via-[#ff3347] to-[#e91f37] text-white shadow-[4px_6px_14px_rgba(190,24,49,0.24),-2px_-2px_7px_rgba(255,255,255,0.7),inset_0_1px_1px_rgba(255,255,255,0.38),inset_0_-2px_4px_rgba(159,18,57,0.12)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[5px_9px_18px_rgba(190,24,49,0.3),-2px_-2px_8px_rgba(255,255,255,0.75),inset_0_1px_1px_rgba(255,255,255,0.42)] active:translate-y-px active:scale-[0.97] active:shadow-[2px_3px_8px_rgba(190,24,49,0.22),inset_0_2px_5px_rgba(127,29,29,0.16)] dark:shadow-[4px_7px_15px_rgba(0,0,0,0.36),-1px_-1px_5px_rgba(255,255,255,0.08),inset_0_1px_1px_rgba(255,255,255,0.32)]"
                aria-label={isDark ? "ប្ដូរទៅផ្ទៃភ្លឺ" : "ប្ដូរទៅផ្ទៃងងឹត"}
              >
                <span className="pointer-events-none absolute left-2 right-2 top-1 h-px rounded-full bg-white/45" />
                {isDark ? (
                  <FiSun className="relative text-[19px] drop-shadow-[0_2px_2px_rgba(127,29,29,0.28)] transition-transform duration-300 group-hover:rotate-45" />
                ) : (
                  <FiMoon className="relative text-[19px] drop-shadow-[0_2px_2px_rgba(127,29,29,0.28)] transition-transform duration-300 group-hover:-rotate-12" />
                )}
              </button>
            </div>
          </header>

          <main className={`flex-1 overflow-x-hidden overflow-y-auto ${theme.contentWrap}`}>
            <div className="min-w-0 p-3 sm:p-4 lg:p-6">
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
