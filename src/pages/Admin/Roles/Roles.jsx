import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiPlusCircle, FiSettings, FiTrash2, FiX, FiSave, FiShield, FiRefreshCw } from "react-icons/fi";
import {
  getRolesApi, createRoleApi, deleteRoleApi,
  getPermissionsApi, syncRolePermissionsApi,
} from "../../../services/role.service";

const PROTECTED_ROLES = ["admin", "staff", "cashier"];

const PERMISSION_GROUPS = [
  { label: "ផ្ទាំងគ្រប់គ្រង",  prefixes: ["dashboard"] },
  { label: "ការលក់",            prefixes: ["sales"] },
  { label: "ការទិញ",            prefixes: ["purchases", "purchase-items", "purchase_returns", "purchase_return_items"] },
  { label: "គ្រប់គ្រងផលិតផល",  prefixes: ["products", "product-variants", "categories", "units"] },
  { label: "ស្តុក",             prefixes: ["stock", "stock-balances", "stock-movements", "inventory-batches"] },
  { label: "អតិថិជន",          prefixes: ["customers"] },
  { label: "អ្នកផ្គត់ផ្គង់",   prefixes: ["suppliers"] },
  { label: "របាយការណ៍",        prefixes: ["reports"] },
  { label: "អ្នកប្រើ & Role",  prefixes: ["users", "roles", "permissions"] },
  { label: "អត្រាប្តូរប្រាក់", prefixes: ["exchange-rate"] },
  { label: "កំណត់ហេតុ",        prefixes: ["audit-log"] },
  { label: "ការកំណត់",         prefixes: ["settings", "backups"] },
];

const DEFAULT_ROLE_PERMISSIONS = {
  admin: null, // null = all permissions

  cashier: [
    "sales.view", "sales.create", "sales.print_receipt",
    "products.view", "product-variants.view",
    "categories.view", "units.view",
    "stock-balances.view",
    "customers.view", "customers.create", "customers.update",
  ],

  staff: [
    "dashboard.view",
    "products.view", "product-variants.view",
    "categories.view", "units.view",
    "stock.view", "stock-balances.view",
    "stock-movements.view", "inventory-batches.view",
  ],
};

export default function Roles() {
  const outlet  = useOutletContext();
  const isDark  = outlet?.isDark ?? false;
  const qc      = useQueryClient();

  const [addOpen,      setAddOpen]      = useState(false);
  const [permRole,     setPermRole]     = useState(null); // { id, name, permissions[] }
  const [newName,      setNewName]      = useState("");
  const [selected,     setSelected]     = useState([]);
  const [addSelected,  setAddSelected]  = useState([]);

  const theme = {
    wrap:     isDark ? "border-zinc-800 bg-zinc-900"       : "border-zinc-200 bg-white",
    head:     "bg-red-600 text-white",
    row:      isDark ? "border-zinc-800 text-zinc-200"     : "border-zinc-200 text-zinc-700",
    empty:    isDark ? "text-zinc-400"                     : "text-zinc-500",
    card:     isDark ? "border-white/10 bg-zinc-900"       : "border-zinc-200 bg-white",
    input:    isDark ? "border-white/10 bg-zinc-800 text-white placeholder:text-zinc-500" : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400",
    muted:    isDark ? "text-zinc-400"                     : "text-zinc-500",
    pageTitle:isDark ? "text-white"                        : "text-zinc-900",
    badge:    isDark ? "border-white/10 bg-white/5 text-zinc-300" : "border-zinc-200 bg-zinc-100 text-zinc-600",
    perm:     isDark ? "border-white/10 bg-white/[0.04] hover:bg-white/10" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100",
    permOn:   isDark ? "border-red-500/50 bg-red-500/10 text-red-400" : "border-red-300 bg-red-50 text-red-600",
    overlay:  isDark ? "bg-black/70" : "bg-black/40",
  };

  // ── Queries ──────────────────────────────────────────────────────
  const { data: rolesData, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn:  () => getRolesApi({ per_page: 100 }),
  });

  const { data: permsData } = useQuery({
    queryKey: ["permissions"],
    queryFn:  getPermissionsApi,
    enabled:  !!permRole || addOpen,
  });

  const roles       = rolesData?.data ?? rolesData?.roles ?? [];
  const allPerms    = permsData?.data ?? [];

  // Group permissions by business function
  const groupedPerms = PERMISSION_GROUPS
    .map((g) => ({
      label: g.label,
      perms: allPerms.filter((p) => g.prefixes.some((prefix) => p.name.startsWith(prefix + "."))),
    }))
    .filter((g) => g.perms.length > 0);

  // ── Mutations ─────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createRoleApi,
    onSuccess: async (data) => {
      const newId = data?.data?.id ?? data?.id;
      if (addSelected.length > 0 && newId) {
        await syncRolePermissionsApi(newId, addSelected);
      }
      qc.invalidateQueries(["roles"]);
      setAddOpen(false);
      setNewName("");
      setAddSelected([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoleApi,
    onSuccess: () => qc.invalidateQueries(["roles"]),
  });

  const syncMutation = useMutation({
    mutationFn: ({ id, permissions }) => syncRolePermissionsApi(id, permissions),
    onSuccess: () => { qc.invalidateQueries(["roles"]); setPermRole(null); },
  });

  // ── Open permissions modal ────────────────────────────────────────
  const openPerms = (role) => {
    const current = (role.permissions ?? []).map((p) => p.name ?? p);
    setSelected(current);
    setPermRole(role);
  };

  // Sort view first, then create, update, delete, others
  const sortPerms = (perms) => {
    const order = { view: 0, create: 1, update: 2, delete: 3 };
    return [...perms].sort((a, b) => {
      const aA = a.name.split(".").slice(1).join(".");
      const bA = b.name.split(".").slice(1).join(".");
      return (order[aA] ?? 9) - (order[bA] ?? 9);
    });
  };

  // Auto-add *.view when selecting any non-view permission
  const withAutoView = (prev, name, allP) => {
    if (name.endsWith(".view")) return prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name];
    if (prev.includes(name)) return prev.filter((p) => p !== name);
    const prefix   = name.split(".")[0];
    const viewPerm = prefix + ".view";
    const hasView  = allP.some((p) => p.name === viewPerm);
    return hasView && !prev.includes(viewPerm) ? [...prev, viewPerm, name] : [...prev, name];
  };

  const togglePerm = (name) =>
    setSelected((prev) => withAutoView(prev, name, allPerms));

  const isProtected = (name) => PROTECTED_ROLES.includes(name?.toLowerCase());

  return (
    <section className="space-y-5">

      {/* ── Header ── */}
      <div className="flex justify-end">
        <button
          onClick={() => { setNewName(""); setAddOpen(true); }}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
        >
          <FiPlusCircle />
          បន្ថែមតួនាទី
        </button>
      </div>

      {/* ── Table ── */}
      <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.wrap}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className={theme.head}>
              <tr>
                <th className="w-20 px-6 py-4 text-left text-sm font-semibold">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Guard</th>
                <th className="w-52 px-6 py-4 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [1,2,3].map((i) => (
                  <tr key={i} className={`border-t ${theme.row}`}>
                    {[1,2,3,4].map((j) => (
                      <td key={j} className="px-6 py-5">
                        <div className={`h-4 animate-pulse rounded ${isDark ? "bg-white/10" : "bg-zinc-200"}`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : roles.length === 0 ? (
                <tr className={`border-t ${theme.row}`}>
                  <td colSpan="4" className={`px-6 py-8 text-center text-sm ${theme.empty}`}>
                    គ្មានតួនាទី
                  </td>
                </tr>
              ) : roles.map((item) => (
                <tr key={item.id} className={`border-t ${theme.row}`}>
                  <td className="px-6 py-4 text-sm">{item.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      {item.name}
                      {isProtected(item.name) && (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${theme.badge}`}>
                          Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{item.guard_name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip label={"កែសិទ្ធិប្រើប្រាស់"}>
                        <button
                        onClick={() => openPerms(item)}
                        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-[0] text-white shadow-md shadow-blue-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:translate-y-0"
                      >
                        <FiSettings size={16} />
                        {/* សិទ្ធិប្រើប្រាស់ */}
                      </button>
                      </Tooltip>
                      <Tooltip label={"លុបសិទ្ធិ"}>
                        <button
                        onClick={() => {
                          if (!isProtected(item.name) && confirm(`លុប "${item.name}"?`))
                            deleteMutation.mutate(item.id);
                        }}
                        disabled={isProtected(item.name)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-red-500 to-red-700 text-white shadow-md shadow-red-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:from-red-600 hover:to-red-800 hover:shadow-lg hover:shadow-red-600/25 focus:outline-none focus:ring-4 focus:ring-red-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-30"
                        title={isProtected(item.name) ? "Default role — cannot delete" : "Delete"}
                      >
                        <FiTrash2 size={14} />
                      </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Role Modal ── */}
      {addOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme.overlay}`}>
          <div className={`flex w-full max-w-2xl flex-col rounded-2xl border shadow-2xl ${theme.card}`} style={{ maxHeight: "90vh" }}>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b px-6 py-4" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e4e4e7" }}>
              <div className="flex items-center gap-2">
                <FiShield className="text-emerald-500" />
                <h2 className={`text-base font-bold ${theme.pageTitle}`}>បន្ថែម Role ថ្មី</h2>
              </div>
              <button onClick={() => { setAddOpen(false); setAddSelected([]); }} className={`rounded-lg p-1.5 ${theme.badge}`}><FiX /></button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ឈ្មោះ Role..."
                className={`h-10 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-2 focus:ring-red-400/30 ${theme.input}`}
              />

              {/* Permissions */}
              <div>
                <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${theme.muted}`}>ជ្រើសរើស Permissions</p>
                {groupedPerms.length === 0 ? (
                  <div className={`py-6 text-center text-sm ${theme.muted}`}>កំពុងផ្ទុក...</div>
                ) : (
                  <div className="space-y-4">
                    {groupedPerms.map((group) => (
                      <div key={group.label}>
                        <p className={`mb-2 text-[11px] font-bold tracking-wider ${theme.muted}`}>{group.label}</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {sortPerms(group.perms).map((p) => {
                            const on      = addSelected.includes(p.name);
                            const isView  = p.name.endsWith(".view");
                            return (
                              <button
                                key={p.name}
                                type="button"
                                onClick={() => setAddSelected((prev) => withAutoView(prev, p.name, allPerms))}
                                className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                                  on
                                    ? isView ? "border-amber-400 bg-amber-500/20 text-amber-600 dark:text-amber-400" : theme.permOn
                                    : theme.perm
                                }`}
                              >
                                {isView && <span className="mr-1 text-amber-500">🔑</span>}
                                {p.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between border-t px-6 py-4" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e4e4e7" }}>
              <span className={`text-xs ${theme.muted}`}>{addSelected.length} permissions បានជ្រើស</span>
              <div className="flex gap-2">
                <button onClick={() => { setAddOpen(false); setAddSelected([]); }} className={`h-9 rounded-xl border px-4 text-sm font-semibold ${theme.badge}`}>
                  បោះបង់
                </button>
                <button
                  disabled={!newName.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate({ name: newName.trim() })}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                >
                  <FiSave size={13} />
                  {createMutation.isPending ? "កំពុងរក្សា..." : "រក្សាទុក"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Permissions Modal ── */}
      {permRole && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${theme.overlay}`}>
          <div className={`flex w-full max-w-2xl flex-col rounded-2xl border shadow-2xl ${theme.card}`} style={{ maxHeight: "90vh" }}>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b px-6 py-4" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e4e4e7" }}>
              <div className="flex items-center gap-2">
                <FiShield className="text-red-500" />
                <h2 className={`text-base font-bold ${theme.pageTitle}`}>
                  Permissions — <span className="text-red-500">{permRole.name}</span>
                </h2>
              </div>
              <button onClick={() => setPermRole(null)} className={`rounded-lg p-1.5 ${theme.badge}`}><FiX /></button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {groupedPerms.length === 0 ? (
                <div className={`py-8 text-center text-sm ${theme.muted}`}>កំពុងផ្ទុក...</div>
              ) : (
                <div className="space-y-5">
                  {groupedPerms.map((group) => (
                    <div key={group.label}>
                      <p className={`mb-2 text-[11px] font-bold tracking-wider ${theme.muted}`}>{group.label}</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {sortPerms(group.perms).map((p) => {
                          const on     = selected.includes(p.name);
                          const isView = p.name.endsWith(".view");
                          return (
                            <button
                              key={p.name}
                              onClick={() => togglePerm(p.name)}
                              className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                                on
                                  ? isView ? "border-amber-400 bg-amber-500/20 text-amber-600 dark:text-amber-400" : theme.permOn
                                  : isView ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400" : theme.perm
                              }`}
                            >
                              {p.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between gap-2 border-t px-6 py-4" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e4e4e7" }}>
              <span className={`text-xs ${theme.muted}`}>{selected.length} permissions បានជ្រើស</span>
              <div className="flex gap-2">
                {DEFAULT_ROLE_PERMISSIONS[permRole?.name] !== undefined && (
                  <button
                    onClick={() => {
                      const defaults = DEFAULT_ROLE_PERMISSIONS[permRole.name];
                      setSelected(defaults === null ? allPerms.map((p) => p.name) : defaults);
                    }}
                    className={`inline-flex h-9 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${isDark ? "border-white/10 text-zinc-300 hover:bg-white/10" : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"}`}
                  >
                    <FiRefreshCw size={13} />
                    Reset Default
                  </button>
                )}
                <button onClick={() => setPermRole(null)} className={`h-9 rounded-xl border px-4 text-sm font-semibold ${theme.badge}`}>
                  បោះបង់
                </button>
                <button
                  onClick={() => syncMutation.mutate({ id: permRole.id, permissions: selected })}
                  disabled={syncMutation.isPending}
                  className="inline-flex h-9 items-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                >
                  <FiSave size={13} />
                  {syncMutation.isPending ? "កំពុងរក្សា..." : "រក្សាទុក"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
function Tooltip({ label, children }) {
  return (
    <div className="relative inline-flex group">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-zinc-700">
        {label}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-800 dark:border-t-zinc-700" />
      </span>
    </div>
  );
}
