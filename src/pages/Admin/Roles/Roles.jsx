import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FiCheck, FiPlusCircle, FiSettings, FiTrash2, FiX, FiSave, FiShield, FiRefreshCw } from "react-icons/fi";
import {
  getRolesApi, createRoleApi, deleteRoleApi,
  getPermissionsApi, syncRolePermissionsApi,
} from "../../../services/role.service";

const PROTECTED_ROLES = ["admin", "staff", "cashier"];

const ROLE_LABELS = {
  admin: "អ្នកគ្រប់គ្រង",
  staff: "បុគ្គលិក",
  cashier: "អ្នកគិតលុយ",
};

const PERMISSION_MODULE_LABELS = {
  dashboard: "ផ្ទាំងគ្រប់គ្រង",
  sales: "ការលក់",
  purchases: "ការទិញ",
  "purchase-items": "មុខទំនិញក្នុងការទិញ",
  purchase_returns: "ការត្រឡប់ការទិញ",
  purchase_return_items: "មុខទំនិញត្រឡប់ការទិញ",
  products: "ផលិតផល",
  "product-variants": "មុខទំនិញ",
  categories: "ប្រភេទទំនិញ",
  units: "ខ្នាតទំនិញ",
  stock: "ស្តុក",
  "stock-balances": "ស្តុកនៅសល់",
  "stock-movements": "ចលនាស្តុក",
  "inventory-batches": "បាច់ស្តុក",
  customers: "អតិថិជន",
  suppliers: "អ្នកផ្គត់ផ្គង់",
  reports: "របាយការណ៍",
  users: "អ្នកប្រើប្រាស់",
  roles: "តួនាទី",
  permissions: "សិទ្ធិប្រើប្រាស់",
  "exchange-rate": "អត្រាប្តូរប្រាក់",
  "audit-log": "កំណត់ហេតុ",
  settings: "ការកំណត់",
  backups: "ទិន្នន័យបម្រុងទុក",
};

const PERMISSION_ACTION_LABELS = {
  view: "មើល",
  create: "បង្កើត",
  update: "កែប្រែ",
  delete: "លុប",
  adjust: "កែសម្រួល",
  receive: "ទទួលចូល",
  "stock-in": "បញ្ចូលស្តុក",
  void: "បោះបង់",
  refund: "សងប្រាក់",
  print_receipt: "បោះពុម្ពបង្កាន់ដៃ",
  assign: "កំណត់",
  restore: "ស្ដារឡើងវិញ",
  sales: "ការលក់",
  inventory: "ស្តុក",
  profit: "ប្រាក់ចំណេញ",
  expenses: "ចំណាយ",
};

const getRoleLabel = (name) => ROLE_LABELS[String(name ?? "").toLowerCase()] ?? name;

const getPermissionLabel = (name) => {
  const [module, ...actionParts] = String(name ?? "").split(".");
  const action = actionParts.join(".");
  const moduleLabel = PERMISSION_MODULE_LABELS[module] ?? module;
  const actionLabel = PERMISSION_ACTION_LABELS[action] ?? action.replaceAll("_", " ");

  if (module === "reports") return `មើលរបាយការណ៍${actionLabel}`;
  return `${actionLabel}${moduleLabel}`;
};

const PERMISSION_GROUPS = [
  { label: "ផ្ទាំងគ្រប់គ្រង",  prefixes: ["dashboard"] },
  { label: "ការលក់",            prefixes: ["sales"] },
  { label: "ការទិញ",            prefixes: ["purchases", "purchase-items", "purchase_returns", "purchase_return_items"] },
  { label: "គ្រប់គ្រងផលិតផល",  prefixes: ["products", "product-variants", "categories", "units"] },
  { label: "ស្តុក",             prefixes: ["stock", "stock-balances", "stock-movements", "inventory-batches"] },
  { label: "អតិថិជន",          prefixes: ["customers"] },
  { label: "អ្នកផ្គត់ផ្គង់",   prefixes: ["suppliers"] },
  { label: "របាយការណ៍",        prefixes: ["reports"] },
  { label: "អ្នកប្រើប្រាស់ និងតួនាទី", prefixes: ["users", "roles", "permissions"] },
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
    title:    isDark ? "text-zinc-200"                     : "text-zinc-700",
    softCard: isDark ? "border-white/10 bg-white/[0.04]"   : "border-zinc-200 bg-zinc-50",
    card:     isDark ? "border-white/10 bg-zinc-900"       : "border-zinc-200 bg-white",
    input:    isDark ? "border-white/10 bg-zinc-800 text-white placeholder:text-zinc-500" : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400",
    muted:    isDark ? "text-zinc-400"                     : "text-zinc-500",
    pageTitle:isDark ? "text-white"                        : "text-zinc-900",
    badge:    isDark ? "border-white/10 bg-white/5 text-zinc-300" : "border-zinc-200 bg-zinc-100 text-zinc-600",
    perm:     isDark
      ? "border-white/10 bg-white/[0.04] text-zinc-200 hover:border-white/20 hover:bg-white/10 focus:ring-white/15"
      : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 focus:ring-zinc-300/40",
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
      <div className="flex justify-stretch sm:justify-end">
        <button
          onClick={() => { setNewName(""); setAddOpen(true); }}
          className="quick-action-icon-3d inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 sm:h-10 sm:w-auto"
        >
          <FiPlusCircle />
          បន្ថែមតួនាទី
        </button>
      </div>

      {/* ── Table ── */}
      <div className={`overflow-hidden rounded-2xl border shadow-sm ${theme.wrap}`}>
        <div className="overflow-x-auto">
          <table className="responsive-card-table w-full min-w-[600px]">
            <thead className={theme.head}>
              <tr>
                <th className="w-20 px-6 py-4 text-left text-sm font-semibold">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">តួនាទី</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">ប្រភេទការពារ</th>
                <th className="w-52 px-6 py-4 text-center text-sm font-semibold">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <Roles3DLoading
                  theme={theme}
                  colSpan={4}
                />
              ) : roles.length === 0 ? (
                <tr className={`border-t ${theme.row}`}>
                  <td colSpan="4" className="px-6 py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className={`summary-icon-3d flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}>
                        <FiShield className={`text-3xl ${theme.muted}`} />
                      </span>
                      <p className={`mt-4 text-sm font-semibold ${theme.title}`}>
                        គ្មានតួនាទី
                      </p>
                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        សូមបន្ថែមតួនាទីថ្មីសម្រាប់អ្នកប្រើប្រាស់។
                      </p>
                    </div>
                  </td>
                </tr>
              ) : roles.map((item) => (
                <tr key={item.id} className={`border-t ${theme.row}`}>
                  <td data-label="ID" className="px-6 py-4 text-sm">{item.id}</td>
                  <td data-label="តួនាទី" className="px-6 py-4 text-sm font-semibold">
                    <div className="flex items-center gap-2">
                      {getRoleLabel(item.name)}
                      {isProtected(item.name) && (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${theme.badge}`}>
                          លំនាំដើម
                        </span>
                      )}
                    </div>
                  </td>
                  <td data-label="ប្រភេទការពារ" className="px-6 py-4 text-sm">{item.guard_name}</td>
                  <td data-label="សកម្មភាព" className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Tooltip label={"កែសិទ្ធិប្រើប្រាស់"}>
                        <button
                        onClick={() => openPerms(item)}
                        className="quick-action-icon-3d flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-blue-600 text-[0] text-white shadow-blue-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/25 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:translate-y-0"
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
                        className="quick-action-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-red-600/20 ring-1 ring-white/30 transition hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-red-600/25 focus:outline-none focus:ring-4 focus:ring-red-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-30"
                        title={isProtected(item.name) ? "មិនអាចលុបតួនាទីលំនាំដើមបានទេ" : "លុប"}
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
        <div className={`fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 ${theme.overlay}`}>
          <div className={`flex w-full max-w-2xl flex-col rounded-t-2xl border shadow-2xl sm:rounded-2xl ${theme.card}`} style={{ maxHeight: "96dvh" }}>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b px-4 py-4 sm:px-6" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e4e4e7" }}>
              <div className="flex items-center gap-2">
                <span className="summary-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500"><FiShield /></span>
                 <h2 className={`text-base font-bold ${theme.pageTitle}`}>បន្ថែមតួនាទីថ្មី</h2>
              </div>
              <button onClick={() => { setAddOpen(false); setAddSelected([]); }} className={`table-icon-3d rounded-lg p-1.5 transition hover:-translate-y-0.5 ${theme.badge}`}><FiX /></button>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                 placeholder="ឈ្មោះតួនាទី..."
                className={`h-10 w-full rounded-xl border px-4 text-sm outline-none transition focus:ring-2 focus:ring-red-400/30 ${theme.input}`}
              />

              {/* Permissions */}
              <div>
                <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${theme.muted}`}>ជ្រើសរើសសិទ្ធិប្រើប្រាស់</p>
                {groupedPerms.length === 0 ? (
                  <div className={`py-6 text-center text-sm ${theme.muted}`}>កំពុងផ្ទុក...</div>
                ) : (
                  <div className="space-y-4">
                    {groupedPerms.map((group) => (
                      <div key={group.label}>
                        <p className={`mb-2 text-[11px] font-bold tracking-wider ${theme.muted}`}>{group.label}</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {sortPerms(group.perms).map((p) => {
                            const on = addSelected.includes(p.name);
                            return (
                              <button
                                key={p.name}
                                type="button"
                                onClick={() => setAddSelected((prev) => withAutoView(prev, p.name, allPerms))}
                                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition focus:outline-none focus:ring-2 ${on ? theme.permOn : theme.perm}`}
                              >
                                <span>{getPermissionLabel(p.name)}</span>
                                {on && <FiCheck className="shrink-0" size={14} aria-hidden="true" />}
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
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e4e4e7" }}>
              <span className={`text-xs ${theme.muted}`}>បានជ្រើស {addSelected.length} សិទ្ធិ</span>
              <div className="flex gap-2">
                <button onClick={() => { setAddOpen(false); setAddSelected([]); }} className={`table-icon-3d h-9 rounded-xl border px-4 text-sm font-semibold transition hover:-translate-y-0.5 ${theme.badge}`}>
                  បោះបង់
                </button>
                <button
                  disabled={!newName.trim() || createMutation.isPending}
                  onClick={() => createMutation.mutate({ name: newName.trim() })}
                  className="quick-action-icon-3d inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:opacity-60"
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
        <div className={`fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 ${theme.overlay}`}>
          <div className={`flex w-full max-w-2xl flex-col rounded-t-2xl border shadow-2xl sm:rounded-2xl ${theme.card}`} style={{ maxHeight: "96dvh" }}>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b px-4 py-4 sm:px-6" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e4e4e7" }}>
              <div className="flex items-center gap-2">
                <span className="summary-icon-3d flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-500"><FiShield /></span>
                <h2 className={`text-base font-bold ${theme.pageTitle}`}>
                   សិទ្ធិប្រើប្រាស់៖ <span className="text-red-500">{getRoleLabel(permRole.name)}</span>
                </h2>
              </div>
              <button onClick={() => setPermRole(null)} className={`table-icon-3d rounded-lg p-1.5 transition hover:-translate-y-0.5 ${theme.badge}`}><FiX /></button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {groupedPerms.length === 0 ? (
                <div className={`py-8 text-center text-sm ${theme.muted}`}>កំពុងផ្ទុក...</div>
              ) : (
                <div className="space-y-5">
                  {groupedPerms.map((group) => (
                    <div key={group.label}>
                      <p className={`mb-2 text-[11px] font-bold tracking-wider ${theme.muted}`}>{group.label}</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {sortPerms(group.perms).map((p) => {
                          const on = selected.includes(p.name);
                          return (
                            <button
                              key={p.name}
                              onClick={() => togglePerm(p.name)}
                              className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition focus:outline-none focus:ring-2 ${on ? theme.permOn : theme.perm}`}
                            >
                              <span title={p.name}>{getPermissionLabel(p.name)}</span>
                              {on && <FiCheck className="shrink-0" size={14} aria-hidden="true" />}
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
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "#e4e4e7" }}>
              <span className={`text-xs ${theme.muted}`}>បានជ្រើស {selected.length} សិទ្ធិ</span>
              <div className="flex gap-2">
                {DEFAULT_ROLE_PERMISSIONS[permRole?.name] !== undefined && (
                  <button
                    onClick={() => {
                      const defaults = DEFAULT_ROLE_PERMISSIONS[permRole.name];
                      setSelected(defaults === null ? allPerms.map((p) => p.name) : defaults);
                    }}
                    className={`table-icon-3d inline-flex h-9 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition hover:-translate-y-0.5 ${isDark ? "border-white/10 text-zinc-300 hover:bg-white/10" : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"}`}
                  >
                    <FiRefreshCw size={13} />
                    កំណត់តាមលំនាំដើមវិញ
                  </button>
                )}
                <button onClick={() => setPermRole(null)} className={`table-icon-3d h-9 rounded-xl border px-4 text-sm font-semibold transition hover:-translate-y-0.5 ${theme.badge}`}>
                  បោះបង់
                </button>
                <button
                  onClick={() => syncMutation.mutate({ id: permRole.id, permissions: selected })}
                  disabled={syncMutation.isPending}
                  className="quick-action-icon-3d inline-flex h-9 items-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-red-600 disabled:opacity-60"
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

function Roles3DLoading({ theme, colSpan }) {
  return (
    <tr className={`border-t ${theme.row}`}>
      <td colSpan={colSpan} className="px-4 py-16 text-center">
        <div
          className="flex min-h-[230px] flex-col items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <div
            className="relative flex h-32 w-32 items-center justify-center"
            style={{ perspective: "700px" }}
          >
            <div className="absolute bottom-1 h-5 w-20 animate-pulse rounded-[50%] bg-blue-500/25 blur-md" />

            <div className="absolute inset-2 animate-spin rounded-full border border-dashed border-blue-400/50 [animation-duration:3s]" />
            <div className="absolute inset-5 animate-spin rounded-full border-2 border-transparent border-l-sky-300 border-r-blue-600 [animation-direction:reverse] [animation-duration:1.8s]" />

            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-white/40 bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-700 text-white"
              style={{
                transform: "rotateX(12deg) rotateY(-18deg) translateZ(18px)",
                boxShadow:
                  "14px 18px 24px rgba(30, 58, 138, 0.3), inset 4px 4px 10px rgba(255,255,255,0.35), inset -5px -7px 12px rgba(49,46,129,0.3)",
              }}
            >
              <div className="absolute inset-1 rounded-[16px] border border-white/20" />
              <FiShield className="relative text-3xl drop-shadow-md" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[11px] font-black text-white shadow-lg shadow-red-500/40">
                ✓
              </span>
            </div>
          </div>

          <p className={`mt-3 text-sm font-bold ${theme.title}`}>
            រង់ចាំបន្តិច...
          </p>
          <p className={`mt-1 text-xs ${theme.muted}`}>
            កំពុងរៀបចំតួនាទី និងសិទ្ធិ
          </p>
        </div>
      </td>
    </tr>
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
