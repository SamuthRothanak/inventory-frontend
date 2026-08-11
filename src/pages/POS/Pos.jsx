import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import PermissionGate from "../../components/PermissionGate";

import ProductBrowser   from "./components/productBrowser";
import CurrentSalePanel from "./components/currentSalePanel";
import QuickAddModal       from "./components/quickAddModal";
import PaymentModal        from "./components/paymentModal";
import SalesReturnsModal   from "./components/salesReturnsModal";
import HardwareScannerInput from "./components/hardwareScannerInput";
import BarcodeCameraModal   from "./components/barcodeCameraModal";
import CustomerSearchSelect from "./components/customerSearchSelect";

import {
  ScanLine, LogOut, X, User,
  Layers, ClipboardList, Maximize, Minimize,
  ShoppingCart, Package2, Clock, Receipt, RotateCcw,
} from "./components/posIcons";
import { getAppliedRule, usd } from "./components/posData";
import { usePosData } from "./usePosData";
import { useNotification } from "../../components/AppNotification";
import { getProductVariantUnitByBarcodeApi } from "../../services/productVariantUnit.service";
import { getSalesApi } from "../../services/sale.service";

// Calendar-day key in the *local* timezone (not UTC) — same helper/reasoning as Sale.jsx's
// toLocalDateKey (Dashboard's Asia/Phnom_Penh "today" boundary) — `.toISOString()` would
// silently shift sales made in the 00:00–07:00 local window into "yesterday".
function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ─── Held Orders Modal ────────────────────────────────────────────
function HeldOrdersModal({ heldOrders, onResume, onDelete, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">ការបញ្ជាទិញដែលផ្អាក</p>
              <p className="text-[10px] text-slate-400">ចុចដើម្បីបន្តការលក់ដែលផ្អាក</p>
            </div>
          </div>
          {heldOrders.length > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
              {heldOrders.length}
            </span>
          )}
          <button type="button" onClick={onClose}
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {heldOrders.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-300">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-600">គ្មានការបញ្ជាទិញដែលផ្អាក</p>
                <p className="mt-0.5 text-xs text-slate-400">ចុច "ផ្អាក" ក្នុង cart ដើម្បីផ្អាកការលក់</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {heldOrders.map((order, i) => (
                <div key={order.id}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-amber-200 hover:bg-amber-50/40">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 font-bold text-sm">
                    #{i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{order.customerName}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span>{order.itemCount} មុខ</span>
                      <span>·</span>
                      <span className="font-semibold text-slate-700">{usd(order.total)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />{order.heldAt}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button type="button" onClick={() => onResume(order)}
                      className="quick-action-icon-3d flex h-8 items-center gap-1 rounded-lg bg-amber-500 px-3 text-xs font-bold text-white transition hover:-translate-y-0.5 hover:bg-amber-600 active:translate-y-0">
                      <Receipt className="h-3.5 w-3.5" /> បន្ត
                    </button>
                    <button type="button" onClick={() => onDelete(order.id)}
                      className="quick-action-icon-3d flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white transition hover:-translate-y-0.5 hover:bg-red-600 active:translate-y-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Today Sales Modal ────────────────────────────────────────────
function TodaySalesModal({ completedSales, onClose }) {
  const totalRevenue = completedSales.reduce((s, sale) => s + sale.total, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">ការលក់ថ្ងៃនេះ</p>
              <p className="text-[10px] text-slate-400">{completedSales.length} ប្រតិបត្តិការ</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary strip */}
        {completedSales.length > 0 && (
          <div className="flex items-center gap-4 border-b border-slate-100 bg-emerald-50 px-5 py-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">ចំណូលសរុប</p>
              <p className="text-xl font-extrabold text-emerald-600">{usd(totalRevenue)}</p>
            </div>
            <div className="h-8 w-px bg-emerald-200" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">ប្រតិបត្តិការ</p>
              <p className="text-xl font-extrabold text-emerald-600">{completedSales.length}</p>
            </div>
          </div>
        )}

        {/* List */}
        <div className="max-h-[50vh] overflow-y-auto p-4">
          {completedSales.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-300">
                <ShoppingCart className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-slate-600">មិនទាន់មានការលក់</p>
                <p className="mt-0.5 text-xs text-slate-400">ការលក់ដែលបានបញ្ចប់នឹងបង្ហាញទីនេះ</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {completedSales.map((sale) => (
                <div key={sale.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">{sale.invoiceNo}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {sale.customerName} · {sale.items?.length ?? 0} មុខ
                      {sale.discountAmount > 0 && ` · -${usd(sale.discountAmount)} បញ្ចុះ`}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0 text-right">
                    <p className="text-sm font-extrabold text-emerald-600">{usd(sale.total)}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-0.5 justify-end">
                      <Clock className="h-2.5 w-2.5" />{sale.saleDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Icon Button ──────────────────────────────────────────────────
const ICON_BTN_COLORS = {
  amber:   "border-amber-200 bg-amber-50   text-amber-500   hover:bg-amber-100   hover:border-amber-300   hover:text-amber-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-500 hover:bg-emerald-100 hover:border-emerald-300 hover:text-emerald-700",
  red:     "border-red-200   bg-red-50     text-red-500     hover:bg-red-100     hover:border-red-300     hover:text-red-600",
  slate:   "border-slate-200 bg-white      text-slate-500   hover:border-slate-300 hover:bg-slate-50     hover:text-slate-800",
};

function IconBtn({ onClick, title, badge, children, active, color = "slate" }) {
  const base = "relative flex h-8 w-8 items-center justify-center rounded-lg border transition";
  const cls  = active
    ? "border-red-300 bg-red-100 text-red-600"
    : (ICON_BTN_COLORS[color] ?? ICON_BTN_COLORS.slate);

  return (
    <div className="relative inline-flex group">
      <button type="button" onClick={onClick} className={`${base} ${cls}`}>
        {children}
        {badge > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white leading-none">
            {badge}
          </span>
        )}
      </button>
      {title && (
        <span className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-zinc-700">
          {title}
          <span className="absolute left-1/2 bottom-full -translate-x-1/2 border-4 border-transparent border-b-zinc-800 dark:border-b-zinc-700" />
        </span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function Pos() {
  const navigate = useNavigate();

  const {
    exchangeRate,
    khrRounding,
    customers,
    categories,
    products,
    isLoading,
    isError,
    refetchStock,
  } = usePosData();

  const [saleMode,           setSaleMode]           = useState("walk-in");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [saleChannel,        setSaleChannel]        = useState("pos");
  const [category,           setCategory]           = useState("All");
  const [search,             setSearch]             = useState("");
  const [selectedProduct,    setSelectedProduct]    = useState(null);
  const [selectedUnitId,     setSelectedUnitId]     = useState("");
  const [qty,                setQty]                = useState(1);
  const [cart,               setCart]               = useState([]);
  const [discountType,       setDiscountType]       = useState("none");
  const [discountValue,      setDiscountValue]      = useState("");
  const [deliveryRequired,   setDeliveryRequired]   = useState(false);
  const [deliveryOption,     setDeliveryOption]     = useState("customer_pickup");
  const [deliveryFee,        setDeliveryFee]        = useState("");
  const [deliveryFeeCurrency,setDeliveryFeeCurrency]= useState("USD");
  const [paymentOpen,        setPaymentOpen]        = useState(false);

  // ── New feature states ──
  // Held orders never touch the backend (holding doesn't create a Sale row — only checkout
  // does), so plain useState alone loses every paused order on refresh/browser-crash with zero
  // warning to the cashier. Persisting to localStorage is the only place left to keep them.
  const [heldOrders,     setHeldOrders]     = useState(() => {
    try {
      const saved = localStorage.getItem("pos_held_orders");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [completedSales, setCompletedSales] = useState([]);
  const [showHeld,       setShowHeld]       = useState(false);
  const [showSales,      setShowSales]      = useState(false);
  const [showReturns,    setShowReturns]    = useState(false);
  const [isFullscreen,   setIsFullscreen]   = useState(false);
  const [saleNote,       setSaleNote]       = useState("");

  const [showBarcodeCameraModal, setShowBarcodeCameraModal] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("pos_held_orders", JSON.stringify(heldOrders));
    } catch {
      // localStorage full/unavailable — held orders stay in-memory only for this session.
    }
  }, [heldOrders]);

  const notify = useNotification();

  const currentUser = useAuthStore((s) => s.user);

  // "ការលក់ថ្ងៃនេះ" (completedSales) used to be purely client-side — only ever grown by
  // handleCompleteSale() as sales happened in THIS browser tab, never hydrated from the server.
  // A refresh remounts the component and resets it to an empty array, so the badge/list looked
  // like it "lost" every sale made before the refresh even though nothing was actually deleted —
  // it just never reflected the real day's total to begin with. Fetch today's completed sales
  // once on mount so the count is correct from the start; handleCompleteSale still prepends new
  // ones live afterward for instant feedback without needing to refetch.
  //
  // created_by scopes this to the LOGGED-IN cashier's own sales — was fetching every cashier's
  // sales for today, so "ការលក់ថ្ងៃនេះ" showed the whole shop's total to whoever was logged in
  // instead of just their own (same scoping already applied to POS's returns list).
  useEffect(() => {
    if (!currentUser?.id) return undefined;

    let cancelled = false;

    (async () => {
      try {
        const res = await getSalesApi({
          per_page: 100,
          sale_status: "completed",
          created_by: currentUser.id,
        });
        const list = Array.isArray(res) ? res
          : Array.isArray(res?.data) ? res.data
          : Array.isArray(res?.data?.data) ? res.data.data
          : [];

        const todayKey = toLocalDateKey(new Date());
        const todaySales = list
          .filter((s) => toLocalDateKey(new Date(s.sold_at || s.created_at)) === todayKey)
          .sort((a, b) => new Date(b.sold_at || b.created_at) - new Date(a.sold_at || a.created_at))
          .map((s) => ({
            id: s.id,
            invoiceNo: s.sale_no,
            saleDate: new Date(s.sold_at || s.created_at).toLocaleString("en-US", {
              year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            }),
            customerName: s.customer_name_snapshot || "អតិថិជនទូទៅ",
            items: s.items || [],
            discountAmount: Number(s.discount_total_usd || 0),
            total: Number(s.grand_total_usd || 0),
          }));

        if (!cancelled) setCompletedSales(todaySales);
      } catch {
        // Non-critical — the badge just starts at 0 instead of blocking POS from loading.
      }
    })();

    return () => { cancelled = true; };
  }, [currentUser?.id]);

  const isAdmin          = useAuthStore((s) => s.can("dashboard.view"));
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;
  const appliesTo = saleMode === "wholesale" ? "customer" : "public";

  // Reprice all cart items whenever pricing mode changes
  useEffect(() => {
    setCart((prev) => {
      if (prev.length === 0) return prev;
      return prev.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return item;
        const unit = product.units.find((u) => u.id === item.unitId);
        if (!unit) return item;
        const newRule = getAppliedRule(unit, item.qty, appliesTo);
        if (!newRule) return item;
        return {
          ...item,
          unitPrice:        newRule.usd,
          lineTotal:        item.qty * newRule.usd,
          appliedRuleId:    newRule.id,
          appliedRuleLabel: newRule.label,
        };
      });
    });
  }, [appliesTo, products]);

  // Base qty already "spoken for" by the live cart or a held (paused, not cancelled) order,
  // per product — neither one has actually left backend stock yet (only checkout does that),
  // so every stock number shown anywhere in the POS screen needs this subtracted, or it looks
  // like adding to cart / holding an order didn't reserve anything at all.
  const reservedBaseQtyByProductId = useMemo(() => {
    const map = {};
    const addQty = (productId, baseQty) => {
      map[productId] = (map[productId] || 0) + (Number(baseQty) || 0);
    };
    cart.forEach((item) => addQty(item.productId, item.baseQty));
    heldOrders.forEach((order) => order.items.forEach((item) => addQty(item.productId, item.baseQty)));
    return map;
  }, [cart, heldOrders]);

  // Left as raw stockBaseQty here on purpose — this feeds selectedProduct (via openQuickAdd)
  // and addProductUnitToCart's own stock-limit math, which already subtracts the live cart's
  // usage itself. ProductBrowser applies reservedBaseQtyByProductId separately, only for what
  // it displays on each tile, so the two don't end up double-subtracting the same reservation.
  const filteredProducts = useMemo(() => {
    const kw = search.toLowerCase().trim();
    return products.filter((item) => {
      const matchCat    = category === "All" || item.category === category;
      const matchSearch = !kw
        || item.productName.toLowerCase().includes(kw)
        || item.variantName.toLowerCase().includes(kw)
        || item.category.toLowerCase().includes(kw)
        || (item.code && item.code.toLowerCase().includes(kw));
      return matchCat && matchSearch;
    });
  }, [category, search, products]);

  const unitOptions    = selectedProduct?.units || [];
  const selectedUnit   = unitOptions.find((u) => u.id === selectedUnitId) || unitOptions[0] || null;
  const appliedRule    = selectedUnit ? getAppliedRule(selectedUnit, qty, appliesTo) : null;
  const unitPrice      = appliedRule?.usd || 0;
  const lineTotal      = qty * unitPrice;
  // Includes held orders, not just the live cart — holding doesn't return those units to
  // stock (the order is paused, not cancelled/abandoned), so they must keep counting against
  // "available" the same way the live cart does, or the number appears to jump back up the
  // moment an order is held.
  const cartBaseQtyForSelectedProduct = selectedProduct
    ? (reservedBaseQtyByProductId[selectedProduct.id] || 0)
    : 0;
  const availableUnits = selectedProduct && selectedUnit
    ? Math.floor(Math.max(0, selectedProduct.stockBaseQty - cartBaseQtyForSelectedProduct) / selectedUnit.conversionQty) : 0;

  const subtotal   = cart.reduce((s, item) => s + item.lineTotal, 0);
  const totalItems = cart.reduce((s, item) => s + item.qty, 0);

  const discountAmount = useMemo(() => {
    const value = Math.max(0, Number.parseFloat(String(discountValue || "0").replace(/,/g, "")) || 0);
    if (discountType === "percent") return subtotal * (Math.min(value, 100) / 100);
    if (discountType === "amount")  return Math.min(value, subtotal);
    if (discountType === "khr")     return Math.min(value / exchangeRate, subtotal);
    return 0;
  }, [discountType, discountValue, subtotal, exchangeRate]);

  const deliveryFeeUsd = useMemo(() => {
    if (!deliveryRequired) return 0;
    const fee = Math.max(0, Number.parseFloat(String(deliveryFee || "0").replace(/,/g, "")) || 0);
    return deliveryFeeCurrency === "KHR" ? fee / exchangeRate : fee;
  }, [deliveryRequired, deliveryFee, deliveryFeeCurrency, exchangeRate]);

  const grandTotal = Math.max(0, subtotal - discountAmount + deliveryFeeUsd);

  // ── Handlers ──
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("auth-storage");
    sessionStorage.clear();
    useAuthStore.setState({ token: null, roles: [] });
    navigate("/login", { replace: true });
  }

  function openQuickAdd(product) {
    setSelectedProduct(product);
    setSelectedUnitId(product.units[0]?.id || "");
    setQty(1);
  }

  function closeQuickAdd() {
    setSelectedProduct(null);
    setSelectedUnitId("");
    setQty(1);
  }

  // Core add-to-cart logic, parameterized so both the QuickAdd modal and the barcode
  // scan paths (camera + hardware scanner) can share one implementation. Returns true
  // if anything was actually added (false when out of stock).
  function addProductUnitToCart(product, unit, requestedQty) {
    if (!product || !unit) return false;
    const rule = getAppliedRule(unit, requestedQty, appliesTo);
    if (!rule) return false;

    // Decide the result synchronously from the current render so callers can show the
    // correct notification. A value mutated inside a React state updater is unreliable:
    // React may run that updater later (and more than once in StrictMode), after this
    // function has already returned.
    const reqQty = Math.max(0, Number(requestedQty) || 0);
    const requestedBaseQty = reqQty * unit.conversionQty;
    // Held orders count too — holding pauses a sale, it doesn't return those units to stock.
    const heldBaseQty = heldOrders.reduce((sum, order) => sum + order.items.reduce(
      (s, item) => item.productId === product.id ? s + (Number(item.baseQty) || 0) : s, 0,
    ), 0);
    const usedBaseQty = heldBaseQty + cart.reduce((sum, item) => (
      item.productId === product.id ? sum + (Number(item.baseQty) || 0) : sum
    ), 0);
    const remainingBaseQty = Math.max(0, product.stockBaseQty - usedBaseQty);
    const addQty = Math.floor(Math.min(requestedBaseQty, remainingBaseQty) / unit.conversionQty);
    if (addQty <= 0) return false;

    setCart((prev) => {
      // Recalculate against `prev` as well, so queued cart updates can never exceed stock.
      const latestUsedBaseQty = heldBaseQty + prev.reduce((sum, item) => (
        item.productId === product.id ? sum + (Number(item.baseQty) || 0) : sum
      ), 0);
      const latestRemainingBaseQty = Math.max(0, product.stockBaseQty - latestUsedBaseQty);
      const latestAddQty = Math.floor(
        Math.min(requestedBaseQty, latestRemainingBaseQty) / unit.conversionQty
      );
      if (latestAddQty <= 0) return prev;

      const existingIdx = prev.findIndex(
        (item) => item.productId === product.id && item.unitId === unit.id
      );
      if (existingIdx !== -1) {
        return prev.map((item, i) => {
          if (i !== existingIdx) return item;
          const newQty   = item.qty + latestAddQty;
          const newRule  = getAppliedRule(unit, newQty, appliesTo);
          const newPrice = newRule?.usd ?? item.unitPrice;
          return {
            ...item,
            qty:              newQty,
            baseQty:          newQty * unit.conversionQty,
            unitPrice:        newPrice,
            lineTotal:        newQty * newPrice,
            appliedRuleId:    newRule?.id    ?? item.appliedRuleId,
            appliedRuleLabel: newRule?.label ?? item.appliedRuleLabel,
          };
        });
      }
      return [...prev, {
        id: crypto.randomUUID(),
        productId:    product.id,
        productName:  product.productName,
        variantName:  product.variantName,
        image:        product.image,
        unitId:       unit.id,
        unitName:     unit.name,
        qty:          latestAddQty,
        baseQty:          latestAddQty * unit.conversionQty,
        unitPrice:        rule.usd,
        lineTotal:        latestAddQty * rule.usd,
        appliedRuleId:    rule.id,
        appliedRuleLabel: rule.label,
      }];
    });
    return true;
  }

  function addToCart() {
    if (!selectedProduct || !selectedUnit || !appliedRule) return;
    addProductUnitToCart(selectedProduct, selectedUnit, qty);
    closeQuickAdd();
  }

  // Shared entry point for both scan methods (camera + hardware HID scanner) — see
  // HardwareScannerInput and BarcodeCameraModal, both call this with the decoded code.
  // Barcode lives on the UNIT (a bottle and its case have different printed barcodes), not on
  // the variant — so a case scan adds 1 case's worth (its full conversion_qty), not 1 bottle.
  async function handleBarcodeScanned(code) {
    const trimmed = String(code || "").trim();
    if (!trimmed) return;

    for (const product of products) {
      const unit = product.units.find((u) => u.barcode && u.barcode === trimmed);
      if (unit) {
        const ok = addProductUnitToCart(product, unit, 1);
        const label = `${product.productName} ${product.variantName}`.trim();
        if (ok) {
          notify.success("បានបន្ថែមទំនិញ", `${label} (${unit.name})`);
        } else {
          notify.error("ទំនិញអស់ស្តុក", `${label} (${unit.name})`);
        }
        return;
      }
    }

    try {
      const res = await getProductVariantUnitByBarcodeApi(trimmed);
      const variantUnit = res?.data ?? res;
      if (variantUnit) {
        notify.info("ត្រូវ Refresh", "ផលិតផលនេះទើបបន្ថែម សូម refresh ទំព័រ POS ជាមុនសិន");
      } else {
        notify.error("រកមិនឃើញផលិតផល", `គ្មានផលិតផលដែលមាន barcode "${trimmed}"`);
      }
    } catch {
      notify.error("រកមិនឃើញផលិតផល", `គ្មានផលិតផលដែលមាន barcode "${trimmed}"`);
    }
  }

  // Shared by the +/- stepper (delta-based) and the typed qty input (absolute) — both need the
  // same stock-limit clamp + reprice, just starting from a different target qty.
  function nextCartItemForQty(item, prev, requestedQty) {
    const product = products.find((p) => p.id === item.productId);
    const unit = product?.units?.find((u) => u.id === item.unitId);
    const conversionQty = unit?.conversionQty || (item.baseQty / item.qty) || 1;
    const heldBaseQty = heldOrders.reduce((sum, order) => sum + order.items.reduce(
      (s, held) => held.productId === item.productId ? s + (Number(held.baseQty) || 0) : s, 0,
    ), 0);
    const otherBaseQty = heldBaseQty + prev.reduce((sum, row) => (
      row.id !== item.id && row.productId === item.productId ? sum + (Number(row.baseQty) || 0) : sum
    ), 0);
    const maxQty = product ? Math.floor(Math.max(0, product.stockBaseQty - otherBaseQty) / conversionQty) : Infinity;
    const nextQty = Math.max(1, Math.min(requestedQty, maxQty));
    const newRule = unit ? getAppliedRule(unit, nextQty, appliesTo) : null;
    const newPrice = newRule?.usd ?? item.unitPrice;
    return {
      ...item,
      qty: nextQty,
      baseQty: conversionQty * nextQty,
      unitPrice: newPrice,
      lineTotal: newPrice * nextQty,
      appliedRuleId: newRule?.id ?? item.appliedRuleId,
      appliedRuleLabel: newRule?.label ?? item.appliedRuleLabel,
    };
  }

  function updateQtyInCart(id, delta) {
    setCart((prev) => prev.map((item) => (
      item.id === id ? nextCartItemForQty(item, prev, item.qty + delta) : item
    )));
  }

  // For the click-to-type qty field — sets an absolute quantity instead of stepping by 1.
  function setQtyInCart(id, newQty) {
    const requestedQty = Math.max(1, Math.floor(Number(newQty) || 1));
    setCart((prev) => prev.map((item) => (
      item.id === id ? nextCartItemForQty(item, prev, requestedQty) : item
    )));
  }

  function removeFromCart(id) { setCart((prev) => prev.filter((item) => item.id !== id)); }

  function clearCart() {
    setCart([]);
    setDiscountType("none");
    setDiscountValue("");
    setDeliveryRequired(false);
    setDeliveryFee("");
    setSaleNote("");
  }

  // ── Hold Order ──
  function holdOrder() {
    if (cart.length === 0) return;
    setHeldOrders((prev) => [...prev, {
      id:                  crypto.randomUUID(),
      heldAt:              new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      customerName:        selectedCustomer?.shopName ?? "អតិថិជនទូទៅ",
      saleMode,
      items:               [...cart],
      subtotal,
      total:               grandTotal,
      itemCount:           totalItems,
      discountType,
      discountValue,
      deliveryRequired,
      deliveryOption,
      deliveryFee,
      deliveryFeeCurrency,
    }]);
    clearCart();
  }

  function resumeOrder(order) {
    setCart(order.items);
    setDiscountType(order.discountType   ?? "none");
    setDiscountValue(order.discountValue ?? "");
    setDeliveryRequired(order.deliveryRequired   ?? false);
    setDeliveryOption(order.deliveryOption       ?? "customer_pickup");
    setDeliveryFee(order.deliveryFee             ?? "");
    setDeliveryFeeCurrency(order.deliveryFeeCurrency ?? "USD");
    setHeldOrders((prev) => prev.filter((o) => o.id !== order.id));
    setShowHeld(false);
  }

  function deleteHeldOrder(id) {
    setHeldOrders((prev) => prev.filter((o) => o.id !== id));
  }

  // ── Complete Sale ──
  function handleCompleteSale(receiptData) {
    setCompletedSales((prev) => [
      { ...receiptData, id: crypto.randomUUID() },
      ...prev.slice(0, 49),
    ]);
    clearCart();
    refetchStock();
  }

  // ── Fullscreen ──
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    // state is synced by the fullscreenchange listener below
  }

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    function onKeyDown(e) {
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
      }
    }
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("keydown", onKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 p-6">
        <div
          className="flex flex-col items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <div
            className="relative flex h-36 w-36 items-center justify-center"
            style={{ perspective: "750px" }}
          >
            <div className="absolute bottom-1 h-5 w-24 animate-pulse rounded-[50%] bg-red-500/25 blur-md" />
            <div className="absolute inset-2 animate-spin rounded-full border border-dashed border-red-400/45 [animation-duration:3.2s]" />
            <div className="absolute inset-6 animate-spin rounded-full border-2 border-transparent border-l-rose-300 border-r-red-600 [animation-direction:reverse] [animation-duration:1.9s]" />

            <div
              className="relative flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-white/50 bg-gradient-to-br from-rose-300 via-red-500 to-red-700 text-white"
              style={{
                transform: "rotateX(12deg) rotateY(-18deg) translateZ(20px)",
                boxShadow:
                  "16px 20px 28px rgba(153, 27, 27, 0.28), inset 5px 5px 11px rgba(255,255,255,0.4), inset -6px -8px 14px rgba(127,29,29,0.3)",
              }}
            >
              <div className="absolute inset-1 rounded-[18px] border border-white/20" />
              <ShoppingCart className="relative h-8 w-8 drop-shadow-md" />
              <span className="absolute -right-1 -top-1 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-white bg-emerald-400 shadow-lg shadow-emerald-400/40" />
            </div>
          </div>

          <p className="mt-3 text-sm font-bold text-slate-700">
            រង់ចាំបន្តិច...
          </p>
          <p className="mt-1 text-xs text-slate-500">
            កំពុងរៀបចំប្រព័ន្ធលក់ POS
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <p className="text-sm font-semibold text-red-500">មិនអាចផ្ទុកទិន្ន័យ POS។</p>
          <p className="mt-1 text-xs text-slate-500">សូម refresh ទំព័រ។</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col gap-3 overflow-y-auto bg-slate-100 p-2 sm:p-3 xl:h-screen xl:overflow-hidden">

      {/* ── Top bar ── */}
      <div className="relative z-30 flex shrink-0 flex-wrap items-center gap-0 overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm xl:flex-nowrap">

        {/* Group A: Logo */}
        <div className="flex shrink-0 items-center gap-2.5 border-r border-slate-100 bg-slate-50 px-3 py-3 sm:px-4 xl:rounded-l-2xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm shadow-red-200">
            <ScanLine className="h-4 w-4" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-extrabold tracking-tight text-slate-900">POS</p>
            <p className="text-[10px] text-slate-400">ចំណុចលក់</p>
          </div>
        </div>

        {/* Group B: Sale mode + Customer */}
        <div className="order-3 flex w-full flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-2.5 sm:gap-3 sm:px-4 xl:order-none xl:w-auto xl:flex-1 xl:flex-nowrap xl:border-t-0">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 shrink-0">
            <button type="button"
              onClick={() => { setSaleMode("walk-in"); setSelectedCustomerId(""); setSaleChannel("pos"); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                saleMode === "walk-in" ? "bg-red-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}>
              <ShoppingCart className="h-3.5 w-3.5" /> លក់រាយ
            </button>
            <button type="button"
              onClick={() => setSaleMode("wholesale")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                saleMode === "wholesale" ? "bg-red-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}>
              <Package2 className="h-3.5 w-3.5" /> លក់ដុំ
            </button>
          </div>

          <div className="hidden h-6 w-px shrink-0 bg-slate-200 sm:block" />

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <CustomerSearchSelect
              customers={customers}
              value={selectedCustomerId}
              onChange={(id) => { setSelectedCustomerId(id); if (!id) setSaleChannel("pos"); }}
              disabled={saleMode !== "wholesale"}
            />
            {saleMode === "wholesale" && selectedCustomer && (
              <span className="hidden truncate text-xs text-slate-500 xl:block">
                {selectedCustomer.contactName} · {selectedCustomer.phone}
              </span>
            )}
          </div>
        </div>

        {/* Group C: Function buttons + Exchange rate + Logout */}
        <div className="relative z-40 ml-auto flex max-w-full shrink-0 items-center gap-2 overflow-x-auto border-l border-slate-100 bg-slate-50 px-3 py-2.5 sm:px-4 xl:overflow-visible xl:rounded-r-2xl">

          {/* ── Function buttons ── */}
          <IconBtn color="amber"   title="ការបញ្ជាទិញដែលផ្អាក"   badge={heldOrders.length}    onClick={() => setShowHeld(true)}>
            <Layers className="h-3.5 w-3.5" />
          </IconBtn>

          <IconBtn color="emerald" title="ការលក់ថ្ងៃនេះ" badge={completedSales.length} onClick={() => setShowSales(true)}>
            <ClipboardList className="h-3.5 w-3.5" />
          </IconBtn>

          {/* Gated the same way Sale.jsx's own return button is (permission="sales.refund") —
              previously ungated here, so a role without it would only find out after opening
              the whole modal and submitting, rather than not seeing the button at all. */}
          <PermissionGate permission="sales.refund">
            <IconBtn color="red"     title="ត្រឡប់ការលក់"                               onClick={() => setShowReturns(true)}>
              <RotateCcw className="h-3.5 w-3.5" />
            </IconBtn>
          </PermissionGate>

          <IconBtn color="slate"   title={isFullscreen ? "ចេញពី Full Screen" : "Full Screen"} active={isFullscreen} onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          </IconBtn>

          <div className="h-6 w-px bg-slate-200" />

          {/* Exchange rate */}
          <div className="hidden h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 sm:flex">
            <span className="text-[11px] text-slate-500">1 USD =</span>
            <span className="text-xs font-extrabold text-slate-900">{exchangeRate.toLocaleString()} KHR</span>
          </div>

          {/* Logged-in user — was nowhere visible in POS, so a shared/borrowed session looked
              identical to logging in as yourself; this makes it obvious at a glance whose sales
              "ការលក់ថ្ងៃនេះ" is now scoped to. */}
          {currentUser?.name && (
            <div className="hidden h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 sm:flex">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-extrabold text-slate-900">{currentUser.name}</span>
            </div>
          )}

          {/* Back to Admin — admin only */}
          {isAdmin && (
            <button type="button" onClick={() => navigate("/home")}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-600 transition hover:bg-blue-100">
              <LogOut className="h-3.5 w-3.5 rotate-180" /> ត្រឡប់ Admin
            </button>
          )}

          {/* Logout */}
          <button type="button" onClick={handleLogout}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600">
            <LogOut className="h-3.5 w-3.5" /> ចេញ
          </button>
        </div>
      </div>

      <HardwareScannerInput onScan={handleBarcodeScanned} />

      {/* ── Main content ── */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 xl:flex-row">
        <ProductBrowser
          categories={categories}
          category={category}
          setCategory={setCategory}
          search={search}
          setSearch={setSearch}
          filteredProducts={filteredProducts}
          reservedBaseQtyByProductId={reservedBaseQtyByProductId}
          onOpenQuickAdd={openQuickAdd}
          onOpenBarcodeCamera={() => setShowBarcodeCameraModal(true)}
        />

        <div className="w-full shrink-0 xl:w-90">
          <CurrentSalePanel
            saleMode={saleMode}
            selectedCustomer={selectedCustomer}
            totalItems={totalItems}
            cart={cart}
            subtotal={subtotal}
            discountType={discountType}
            setDiscountType={setDiscountType}
            discountValue={discountValue}
            setDiscountValue={setDiscountValue}
            discountAmount={discountAmount}
            deliveryRequired={deliveryRequired}
            setDeliveryRequired={setDeliveryRequired}
            deliveryOption={deliveryOption}
            setDeliveryOption={setDeliveryOption}
            deliveryFee={deliveryFee}
            setDeliveryFee={setDeliveryFee}
            deliveryFeeCurrency={deliveryFeeCurrency}
            setDeliveryFeeCurrency={setDeliveryFeeCurrency}
            saleChannel={saleChannel}
            setSaleChannel={setSaleChannel}
            deliveryFeeUsd={deliveryFeeUsd}
            total={grandTotal}
            onUpdateQty={updateQtyInCart}
            onSetQty={setQtyInCart}
            onRemove={removeFromCart}
            onClear={clearCart}
            onHold={holdOrder}
            onOpenPayment={() => setPaymentOpen(true)}
            exchangeRate={exchangeRate}
            note={saleNote}
            onNoteChange={setSaleNote}
          />
        </div>
      </div>

      {/* ── Modals ── */}
      <QuickAddModal
        selectedProduct={selectedProduct}
        selectedUnitId={selectedUnitId}
        setSelectedUnitId={setSelectedUnitId}
        qty={qty}
        setQty={setQty}
        appliedRule={appliedRule}
        availableUnits={availableUnits}
        unitPrice={unitPrice}
        lineTotal={lineTotal}
        onClose={closeQuickAdd}
        onAddToCart={addToCart}
      />

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={grandTotal}
        saleMode={saleMode}
        selectedCustomer={selectedCustomer}
        saleChannel={saleChannel}
        cartItems={cart}
        subtotal={subtotal}
        discountAmount={discountAmount}
        deliveryFeeUsd={deliveryFeeUsd}
        exchangeRate={exchangeRate}
        khrRounding={khrRounding}
        cashierName={currentUser?.name || "Cashier"}
        note={saleNote}
        deliveryRequired={deliveryRequired}
        deliveryOption={deliveryOption}
        deliveryFee={deliveryFee}
        deliveryFeeCurrency={deliveryFeeCurrency}
        onCompleteSale={handleCompleteSale}
      />

      {showHeld && (
        <HeldOrdersModal
          heldOrders={heldOrders}
          onResume={resumeOrder}
          onDelete={deleteHeldOrder}
          onClose={() => setShowHeld(false)}
        />
      )}

      {showSales && (
        <TodaySalesModal
          completedSales={completedSales}
          onClose={() => setShowSales(false)}
        />
      )}

      {showReturns && (
        <SalesReturnsModal onClose={() => setShowReturns(false)} />
      )}

      {showBarcodeCameraModal && (
        <BarcodeCameraModal
          onScan={handleBarcodeScanned}
          onClose={() => setShowBarcodeCameraModal(false)}
        />
      )}
    </div>
  );
}
