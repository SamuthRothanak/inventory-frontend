import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

import ProductBrowser   from "./components/productBrowser";
import CurrentSalePanel from "./components/currentSalePanel";
import QuickAddModal    from "./components/quickAddModal";
import PaymentModal     from "./components/paymentModal";

import {
  ScanLine, LogOut, User, Users, X,
  Layers, ClipboardList, Maximize, Minimize,
  ShoppingCart, Clock, Receipt,
} from "./components/posIcons";
import {
  EXCHANGE_RATE, customers, categories, products,
  getAppliedRule, usd, khr,
} from "./components/posData";

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
              <p className="font-bold text-slate-900">Held Orders</p>
              <p className="text-[10px] text-slate-400">Click to resume a paused sale</p>
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
                <p className="font-semibold text-slate-600">No held orders</p>
                <p className="mt-0.5 text-xs text-slate-400">Press Hold in the cart to pause a sale.</p>
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
                      <span>{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}</span>
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
                      className="flex h-8 items-center gap-1 rounded-lg bg-amber-500 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600">
                      <Receipt className="h-3.5 w-3.5" /> Resume
                    </button>
                    <button type="button" onClick={() => onDelete(order.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500">
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
              <p className="font-bold text-slate-900">Today's Sales</p>
              <p className="text-[10px] text-slate-400">{completedSales.length} transactions this session</p>
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total Revenue</p>
              <p className="text-xl font-extrabold text-emerald-600">{usd(totalRevenue)}</p>
            </div>
            <div className="h-8 w-px bg-emerald-200" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Transactions</p>
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
                <p className="font-semibold text-slate-600">No sales yet</p>
                <p className="mt-0.5 text-xs text-slate-400">Completed sales will appear here.</p>
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
                      {sale.customerName} · {sale.items?.length ?? 0} item{(sale.items?.length ?? 0) !== 1 ? "s" : ""}
                      {sale.discountAmount > 0 && ` · -${usd(sale.discountAmount)} disc.`}
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
function IconBtn({ onClick, title, badge, children, active }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={`relative flex h-8 w-8 items-center justify-center rounded-lg border transition
        ${active
          ? "border-red-200 bg-red-50 text-red-500"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
        }`}>
      {children}
      {badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white leading-none">
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function Pos() {
  const navigate = useNavigate();

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
  const [heldOrders,     setHeldOrders]     = useState([]);
  const [completedSales, setCompletedSales] = useState([]);
  const [showHeld,       setShowHeld]       = useState(false);
  const [showSales,      setShowSales]      = useState(false);
  const [isFullscreen,   setIsFullscreen]   = useState(false);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;
  const appliesTo = saleMode === "wholesale" && selectedCustomer ? "customer" : "public";

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
  }, [category, search]);

  const unitOptions    = selectedProduct?.units || [];
  const selectedUnit   = unitOptions.find((u) => u.id === selectedUnitId) || unitOptions[0] || null;
  const appliedRule    = selectedUnit ? getAppliedRule(selectedUnit, qty, appliesTo) : null;
  const unitPrice      = appliedRule?.usd || 0;
  const lineTotal      = qty * unitPrice;
  const availableUnits = selectedProduct && selectedUnit
    ? Math.floor(selectedProduct.stockBaseQty / selectedUnit.conversionQty) : 0;

  const subtotal   = cart.reduce((s, item) => s + item.lineTotal, 0);
  const totalItems = cart.reduce((s, item) => s + item.qty, 0);

  const discountAmount = useMemo(() => {
    if (discountType === "percent") return subtotal * (Math.min(parseFloat(discountValue || 0), 100) / 100);
    if (discountType === "amount")  return Math.min(parseFloat(discountValue || 0), subtotal);
    return 0;
  }, [discountType, discountValue, subtotal]);

  const deliveryFeeUsd = useMemo(() => {
    if (!deliveryRequired) return 0;
    const fee = parseFloat(deliveryFee || 0);
    return deliveryFeeCurrency === "KHR" ? fee / EXCHANGE_RATE : fee;
  }, [deliveryRequired, deliveryFee, deliveryFeeCurrency]);

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

  function addToCart() {
    if (!selectedProduct || !selectedUnit || !appliedRule) return;
    setCart((prev) => [...prev, {
      id:               crypto.randomUUID(),
      productId:        selectedProduct.id,
      productName:      selectedProduct.productName,
      variantName:      selectedProduct.variantName,
      image:            selectedProduct.image,
      unitId:           selectedUnit.id,
      unitName:         selectedUnit.name,
      qty,
      baseQty:          qty * selectedUnit.conversionQty,
      unitPrice,
      lineTotal,
      appliedRuleId:    appliedRule.id,
      appliedRuleLabel: appliedRule.label,
    }]);
    closeQuickAdd();
  }

  function updateQtyInCart(id, delta) {
    setCart((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const nextQty = Math.max(1, item.qty + delta);
      return { ...item, qty: nextQty, baseQty: (item.baseQty / item.qty) * nextQty, lineTotal: item.unitPrice * nextQty };
    }));
  }

  function removeFromCart(id) { setCart((prev) => prev.filter((item) => item.id !== id)); }

  function clearCart() {
    setCart([]);
    setDiscountType("none");
    setDiscountValue("");
    setDeliveryRequired(false);
    setDeliveryFee("");
  }

  // ── Hold Order ──
  function holdOrder() {
    if (cart.length === 0) return;
    setHeldOrders((prev) => [...prev, {
      id:           crypto.randomUUID(),
      heldAt:       new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      customerName: selectedCustomer?.shopName ?? "Walk-in",
      saleMode,
      items:        [...cart],
      subtotal,
      total:        grandTotal,
      itemCount:    totalItems,
    }]);
    clearCart();
  }

  function resumeOrder(order) {
    setCart(order.items);
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 p-3 gap-3">

      {/* ── Top bar ── */}
      <div className="flex shrink-0 items-center gap-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

        {/* Group A: Logo */}
        <div className="flex shrink-0 items-center gap-2.5 border-r border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm shadow-red-200">
            <ScanLine className="h-4 w-4" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-extrabold tracking-tight text-slate-900">POS</p>
            <p className="text-[10px] text-slate-400">Point of Sale</p>
          </div>
        </div>

        {/* Group B: Sale mode + Customer */}
        <div className="flex flex-1 items-center gap-3 px-4 py-2.5">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 shrink-0">
            <button type="button"
              onClick={() => { setSaleMode("walk-in"); setSelectedCustomerId(""); }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                saleMode === "walk-in" ? "bg-red-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}>
              <User className="h-3.5 w-3.5" /> Walk-in
            </button>
            <button type="button"
              onClick={() => setSaleMode("wholesale")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                saleMode === "wholesale" ? "bg-red-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}>
              <Users className="h-3.5 w-3.5" /> Wholesale
            </button>
          </div>

          <div className="h-6 w-px shrink-0 bg-slate-200" />

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              disabled={saleMode !== "wholesale"}
              className="h-9 w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 focus:border-red-300"
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.shopName} ({c.code})</option>
              ))}
            </select>
            {saleMode === "wholesale" && selectedCustomer && (
              <span className="hidden truncate text-xs text-slate-500 xl:block">
                {selectedCustomer.contactName} · {selectedCustomer.phone}
              </span>
            )}
          </div>
        </div>

        {/* Group C: Function buttons + Exchange rate + Logout */}
        <div className="flex shrink-0 items-center gap-2 border-l border-slate-100 bg-slate-50 px-4 py-2.5">

          {/* ── Function buttons ── */}
          <IconBtn
            title="Held Orders"
            badge={heldOrders.length}
            onClick={() => setShowHeld(true)}
          >
            <Layers className="h-3.5 w-3.5" />
          </IconBtn>

          <IconBtn
            title="Today's Sales"
            badge={completedSales.length}
            onClick={() => setShowSales(true)}
          >
            <ClipboardList className="h-3.5 w-3.5" />
          </IconBtn>

          <IconBtn
            title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
            active={isFullscreen}
            onClick={toggleFullscreen}
          >
            {isFullscreen
              ? <Minimize className="h-3.5 w-3.5" />
              : <Maximize className="h-3.5 w-3.5" />
            }
          </IconBtn>

          <div className="h-6 w-px bg-slate-200" />

          {/* Exchange rate */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 h-8">
            <span className="text-[11px] text-slate-500">1 USD =</span>
            <span className="text-xs font-extrabold text-slate-900">{EXCHANGE_RATE.toLocaleString()} KHR</span>
          </div>

          {/* Logout */}
          <button type="button" onClick={handleLogout}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600">
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex min-h-0 flex-1 gap-3">
        <ProductBrowser
          categories={categories}
          category={category}
          setCategory={setCategory}
          search={search}
          setSearch={setSearch}
          filteredProducts={filteredProducts}
          onOpenQuickAdd={openQuickAdd}
        />

        <div className="w-90 shrink-0">
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
            onRemove={removeFromCart}
            onClear={clearCart}
            onHold={holdOrder}
            onOpenPayment={() => setPaymentOpen(true)}
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
    </div>
  );
}
