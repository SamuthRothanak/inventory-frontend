import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

import ProductBrowser from "./components/productBrowser";
import CurrentSalePanel from "./components/currentSalePanel";
import QuickAddModal from "./components/quickAddModa";
import PaymentModal from "./components/paymentModal";
import { ScanLine, LogOut, User, Users } from "./components/posIcons";
import { SectionCard } from "./components/ui";
import {
  EXCHANGE_RATE,
  customers,
  categories,
  products,
  getAppliedRule,
} from "./components/posData";

export default function Pos() {
  const navigate = useNavigate();

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [saleMode, setSaleMode] = useState("walk-in");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState([]);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const [paymentType, setPaymentType] = useState("cash");
  const [cashCurrency, setCashCurrency] = useState("USD");
  const [cashAmount, setCashAmount] = useState("");
  const [transferProvider, setTransferProvider] = useState("ABA");
  const [transferAmount, setTransferAmount] = useState("");
  const [splitProvider, setSplitProvider] = useState("ABA");
  const [splitTransferAmount, setSplitTransferAmount] = useState("10");
  const [splitCashCurrency, setSplitCashCurrency] = useState("USD");
  const [splitCashAmount, setSplitCashAmount] = useState("10");

  const selectedCustomer =
    customers.find((customer) => customer.id === selectedCustomerId) || null;

  const appliesTo =
    saleMode === "wholesale" && selectedCustomer ? "customer" : "public";

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const query = search.toLowerCase().trim();

      const matchesSearch =
        query.length === 0 ||
        item.productName.toLowerCase().includes(query) ||
        item.variantName.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.code && item.code.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const unitOptions = selectedProduct?.units || [];
  const selectedUnit =
    unitOptions.find((unit) => unit.id === selectedUnitId) ||
    unitOptions[0] ||
    null;

  const appliedRule = selectedUnit
    ? getAppliedRule(selectedUnit, qty, appliesTo)
    : null;

  const unitPrice = appliedRule?.usd || 0;
  const lineTotal = qty * unitPrice;

  const availableUnits =
    selectedProduct && selectedUnit
      ? Math.floor(selectedProduct.stockBaseQty / selectedUnit.conversionQty)
      : 0;

  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = subtotal;

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("auth-storage");
    sessionStorage.clear();

    useAuthStore.setState({
      token: null,
      roles: [],
    });

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

    const nextItem = {
      id: crypto.randomUUID(),
      productId: selectedProduct.id,
      productName: selectedProduct.productName,
      variantName: selectedProduct.variantName,
      image: selectedProduct.image,
      unitId: selectedUnit.id,
      unitName: selectedUnit.name,
      qty,
      baseQty: qty * selectedUnit.conversionQty,
      unitPrice,
      lineTotal,
      appliedRuleId: appliedRule.id,
      appliedRuleLabel: appliedRule.label,
    };

    setCart((prev) => [...prev, nextItem]);
    closeQuickAdd();
  }

  function updateQtyInCart(id, delta) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const nextQty = Math.max(1, item.qty + delta);

        return {
          ...item,
          qty: nextQty,
          lineTotal: item.unitPrice * nextQty,
          baseQty: (item.baseQty / item.qty) * nextQty,
        };
      })
    );
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  function clearCart() {
    setCart([]);
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-[1680px] space-y-4">
        <SectionCard className="p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                  <ScanLine className="h-6 w-6 text-red-500" />
                  POS Selling
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Supports cash, ABA or Wing transfer, and split payment for
                  walk-in and wholesale customers.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 shadow-sm transition hover:border-red-300 hover:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Sale Mode</div>

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSaleMode("walk-in");
                      setSelectedCustomerId("");
                    }}
                    className={`inline-flex items-center rounded-2xl px-3 py-2 text-sm font-medium transition ${
                      saleMode === "walk-in"
                        ? "bg-red-500 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Walk-in
                  </button>

                  <button
                    type="button"
                    onClick={() => setSaleMode("wholesale")}
                    className={`inline-flex items-center rounded-2xl px-3 py-2 text-sm font-medium transition ${
                      saleMode === "wholesale"
                        ? "bg-red-500 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Wholesale
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Wholesale Customer</div>

                <select
                  value={selectedCustomerId}
                  onChange={(event) => setSelectedCustomerId(event.target.value)}
                  disabled={saleMode !== "wholesale"}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.shopName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Today Exchange Rate</div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">1 USD</span>
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900 ring-1 ring-slate-200">
                    {EXCHANGE_RATE.toLocaleString()} KHR
                  </span>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.9fr_0.9fr]">
          <ProductBrowser
            categories={categories}
            category={category}
            setCategory={setCategory}
            search={search}
            setSearch={setSearch}
            filteredProducts={filteredProducts}
            onOpenQuickAdd={openQuickAdd}
          />

          <CurrentSalePanel
            saleMode={saleMode}
            selectedCustomer={selectedCustomer}
            totalItems={totalItems}
            cart={cart}
            subtotal={subtotal}
            total={total}
            onUpdateQty={updateQtyInCart}
            onRemove={removeFromCart}
            onClear={clearCart}
            onOpenPayment={() => setPaymentOpen(true)}
          />
        </div>
      </div>

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
        total={total}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        cashCurrency={cashCurrency}
        setCashCurrency={setCashCurrency}
        cashAmount={cashAmount}
        setCashAmount={setCashAmount}
        transferProvider={transferProvider}
        setTransferProvider={setTransferProvider}
        transferAmount={transferAmount}
        setTransferAmount={setTransferAmount}
        splitProvider={splitProvider}
        setSplitProvider={setSplitProvider}
        splitTransferAmount={splitTransferAmount}
        setSplitTransferAmount={setSplitTransferAmount}
        splitCashCurrency={splitCashCurrency}
        setSplitCashCurrency={setSplitCashCurrency}
        splitCashAmount={splitCashAmount}
        setSplitCashAmount={setSplitCashAmount}
      />
    </div>
  );
}