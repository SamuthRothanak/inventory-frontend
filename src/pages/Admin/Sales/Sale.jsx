import React, { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  FiCalendar,
  FiEye,
  FiPrinter,
  FiRotateCcw,
  FiSearch,
  FiArrowUpRight,
  FiDollarSign,
  FiShoppingCart,
  FiRefreshCcw,
  FiFilter,
  FiChevronDown,
  FiCreditCard,
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiHash,
  FiClock,
  FiTruck,
  FiPackage,
  FiX,
  FiSave,
  FiAlertTriangle,
  FiMapPin,
  FiFileText,
  FiInfo,
} from "react-icons/fi";

const initialSales = [
  {
    id: 1,
    saleNo: "INV-001",
    customerId: null,
    customerName: "Walk-in",
    cashierName: "Sokha",
    saleType: "retail",
    saleChannel: "pos",
    invoiceCurrency: "USD",
    exchangeRateKhrPerUsd: 4000,
    saleDate: "2026-05-01",
    displayDate: "01 May 2026",
    subtotal: 12.5,
    discountTotal: 0,
    deliveryRequired: false,
    deliveryOption: "customer_pickup",
    deliveryFee: 0,
    deliveryFeeCurrency: "USD",
    deliveryAddress: "",
    deliveryStatus: "none",
    grandTotal: 12.5,
    saleStatus: "completed",
    paymentStatus: "paid",
    isPrinted: true,
    printedAt: "2026-05-01 10:15",
    note: "Walk-in retail sale.",
    items: [
      {
        id: 101,
        productNameSnapshot: "Coca-Cola",
        variantNameSnapshot: "Coca-Cola Can 330ml",
        unitNameSnapshot: "Can",
        qty: 5,
        baseQty: 5,
        unitPrice: 0.5,
        discountType: "none",
        discountValue: 0,
        discountAmount: 0,
        lineSubtotal: 2.5,
        lineTotal: 2.5,
      },
      {
        id: 102,
        productNameSnapshot: "Face Mask",
        variantNameSnapshot: "Face Mask Box",
        unitNameSnapshot: "Box",
        qty: 2,
        baseQty: 2,
        unitPrice: 5,
        discountType: "none",
        discountValue: 0,
        discountAmount: 0,
        lineSubtotal: 10,
        lineTotal: 10,
      },
    ],
    payments: [
      {
        id: 1001,
        paymentMethod: "cash",
        providerName: "Cash",
        currencyCode: "USD",
        amountReceived: 12.5,
        exchangeRateUsed: 4000,
        amountAppliedInvoiceCurrency: 12.5,
        changeAmount: 0,
        changeCurrency: "USD",
        referenceNo: "",
        paidAt: "2026-05-01 10:15",
      },
    ],
    returns: [],
  },
  {
    id: 2,
    saleNo: "INV-002",
    customerId: 1,
    customerName: "Dara Mini Mart",
    cashierName: "Nita",
    saleType: "wholesale",
    saleChannel: "phone_order",
    invoiceCurrency: "USD",
    exchangeRateKhrPerUsd: 4000,
    saleDate: "2026-05-01",
    displayDate: "01 May 2026",
    subtotal: 140,
    discountTotal: 5,
    deliveryRequired: true,
    deliveryOption: "shop_delivery",
    deliveryFee: 2,
    deliveryFeeCurrency: "USD",
    deliveryAddress: "Kandal province",
    deliveryStatus: "delivered",
    grandTotal: 137,
    saleStatus: "completed",
    paymentStatus: "paid",
    isPrinted: true,
    printedAt: "2026-05-01 14:20",
    note: "Wholesale customer. Delivered by shop.",
    items: [
      {
        id: 201,
        productNameSnapshot: "Coca-Cola",
        variantNameSnapshot: "Coca-Cola Can 330ml",
        unitNameSnapshot: "Case",
        qty: 20,
        baseQty: 480,
        unitPrice: 7,
        discountType: "amount",
        discountValue: 5,
        discountAmount: 5,
        lineSubtotal: 140,
        lineTotal: 135,
      },
    ],
    payments: [
      {
        id: 2001,
        paymentMethod: "mobile_payment",
        providerName: "ABA",
        currencyCode: "USD",
        amountReceived: 100,
        exchangeRateUsed: 4000,
        amountAppliedInvoiceCurrency: 100,
        changeAmount: 0,
        changeCurrency: "USD",
        referenceNo: "ABA-29302",
        paidAt: "2026-05-01 14:20",
      },
      {
        id: 2002,
        paymentMethod: "cash",
        providerName: "Cash",
        currencyCode: "KHR",
        amountReceived: 148000,
        exchangeRateUsed: 4000,
        amountAppliedInvoiceCurrency: 37,
        changeAmount: 0,
        changeCurrency: "KHR",
        referenceNo: "",
        paidAt: "2026-05-01 14:20",
      },
    ],
    returns: [],
  },
  {
    id: 3,
    saleNo: "INV-003",
    customerId: null,
    customerName: "Walk-in",
    cashierName: "Sokha",
    saleType: "retail",
    saleChannel: "pos",
    invoiceCurrency: "USD",
    exchangeRateKhrPerUsd: 4000,
    saleDate: "2026-05-02",
    displayDate: "02 May 2026",
    subtotal: 9.75,
    discountTotal: 0,
    deliveryRequired: false,
    deliveryOption: "customer_pickup",
    deliveryFee: 0,
    deliveryFeeCurrency: "USD",
    deliveryAddress: "",
    deliveryStatus: "none",
    grandTotal: 9.75,
    saleStatus: "completed",
    paymentStatus: "refunded",
    isPrinted: true,
    printedAt: "2026-05-02 09:30",
    note: "Refunded because customer returned damaged item.",
    items: [
      {
        id: 301,
        productNameSnapshot: "Dove Shampoo",
        variantNameSnapshot: "Dove Shampoo 250ml",
        unitNameSnapshot: "Bottle",
        qty: 3,
        baseQty: 3,
        unitPrice: 3.25,
        discountType: "none",
        discountValue: 0,
        discountAmount: 0,
        lineSubtotal: 9.75,
        lineTotal: 9.75,
      },
    ],
    payments: [
      {
        id: 3001,
        paymentMethod: "cash",
        providerName: "Cash",
        currencyCode: "USD",
        amountReceived: 9.75,
        exchangeRateUsed: 4000,
        amountAppliedInvoiceCurrency: 9.75,
        changeAmount: 0,
        changeCurrency: "USD",
        referenceNo: "",
        paidAt: "2026-05-02 09:30",
      },
    ],
    returns: [
      {
        id: 1,
        salesReturnNo: "SR-001",
        returnType: "full_return",
        resolutionType: "refund",
        totalAmount: 9.75,
        reason: "Damaged product",
        status: "completed",
        createdAt: "2026-05-02",
      },
    ],
  },
  {
    id: 4,
    saleNo: "INV-004",
    customerId: 2,
    customerName: "Sokha Mart",
    cashierName: "Admin",
    saleType: "wholesale",
    saleChannel: "online",
    invoiceCurrency: "USD",
    exchangeRateKhrPerUsd: 4000,
    saleDate: "2026-05-03",
    displayDate: "03 May 2026",
    subtotal: 80,
    discountTotal: 0,
    deliveryRequired: true,
    deliveryOption: "third_party_delivery",
    deliveryFee: 3,
    deliveryFeeCurrency: "USD",
    deliveryAddress: "Phnom Penh",
    deliveryStatus: "pending",
    grandTotal: 83,
    saleStatus: "confirmed",
    paymentStatus: "partial",
    isPrinted: false,
    printedAt: "",
    note: "Partial payment. Waiting delivery.",
    items: [
      {
        id: 401,
        productNameSnapshot: "Face Mask",
        variantNameSnapshot: "Face Mask Box",
        unitNameSnapshot: "Set",
        qty: 20,
        baseQty: 120,
        unitPrice: 4,
        discountType: "none",
        discountValue: 0,
        discountAmount: 0,
        lineSubtotal: 80,
        lineTotal: 80,
      },
    ],
    payments: [
      {
        id: 4001,
        paymentMethod: "mobile_payment",
        providerName: "ABA",
        currencyCode: "USD",
        amountReceived: 50,
        exchangeRateUsed: 4000,
        amountAppliedInvoiceCurrency: 50,
        changeAmount: 0,
        changeCurrency: "USD",
        referenceNo: "ABA-33211",
        paidAt: "2026-05-03 11:00",
      },
    ],
    returns: [],
  },
];

const emptyReturnForm = {
  returnType: "partial_return",
  resolutionType: "refund",
  reason: "",
  totalAmount: "",
  status: "pending",
};

function useLockBodyScroll(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen]);
}

export default function Sale() {
  const outlet = useOutletContext();
  const isDark = outlet?.isDark ?? false;

  const [sales, setSales] = useState(initialSales);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [saleTypeFilter, setSaleTypeFilter] = useState("All");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");
  const [saleStatusFilter, setSaleStatusFilter] = useState("All");

  const [modalMode, setModalMode] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnForm, setReturnForm] = useState(emptyReturnForm);
  const [returnErrors, setReturnErrors] = useState({});

  useLockBodyScroll(Boolean(modalMode));

  const theme = {
    pageTitle: isDark ? "text-white" : "text-zinc-900",

    card: isDark
      ? "border-white/10 bg-zinc-900 text-white"
      : "border-zinc-200 bg-white text-zinc-900",

    modal: isDark
      ? "border-white/10 bg-[#111113] text-white"
      : "border-zinc-200 bg-white text-zinc-900",

    modalHeader: isDark
      ? "border-white/10 bg-[#111113]"
      : "border-zinc-200 bg-white",

    modalBody: isDark ? "bg-[#151518]" : "bg-zinc-50/70",

    muted: isDark ? "text-zinc-400" : "text-zinc-500",

    input: isDark
      ? "border-white/10 bg-[#1b1b1f] text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-red-400 focus:ring-red-400/20",

    select: isDark
      ? "border-white/10 bg-[#1b1b1f] text-white focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-300 bg-white text-zinc-900 focus:border-red-400 focus:ring-red-400/20",

    tableWrap: isDark
      ? "border-white/10 bg-zinc-900"
      : "border-zinc-200 bg-white",

    row: isDark
      ? "border-white/10 text-zinc-200 hover:bg-white/[0.04]"
      : "border-zinc-200 text-zinc-700 hover:bg-zinc-50",

    badge: isDark
      ? "border-white/10 bg-white/5 text-zinc-200"
      : "border-zinc-200 bg-zinc-100 text-zinc-700",

    softCard: isDark
      ? "border-white/10 bg-white/[0.04]"
      : "border-zinc-200 bg-white",

    section: isDark
      ? "border-white/10 bg-[#18181b]"
      : "border-zinc-200 bg-white",
  };

  const filteredSales = useMemo(() => {
    const keyword = searchTerm.toLowerCase().trim();

    return sales.filter((sale) => {
      const paymentNames = sale.payments
        .map((payment) => payment.providerName)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !keyword ||
        sale.saleNo.toLowerCase().includes(keyword) ||
        sale.customerName.toLowerCase().includes(keyword) ||
        sale.cashierName.toLowerCase().includes(keyword) ||
        sale.saleType.toLowerCase().includes(keyword) ||
        sale.saleChannel.toLowerCase().includes(keyword) ||
        paymentNames.includes(keyword) ||
        sale.items.some(
          (item) =>
            item.productNameSnapshot.toLowerCase().includes(keyword) ||
            item.variantNameSnapshot.toLowerCase().includes(keyword)
        );

      const matchesDate = !startDate || sale.saleDate >= startDate;

      const matchesSaleType =
        saleTypeFilter === "All" || sale.saleType === saleTypeFilter;

      const matchesPaymentStatus =
        paymentStatusFilter === "All" ||
        sale.paymentStatus === paymentStatusFilter;

      const matchesSaleStatus =
        saleStatusFilter === "All" || sale.saleStatus === saleStatusFilter;

      return (
        matchesSearch &&
        matchesDate &&
        matchesSaleType &&
        matchesPaymentStatus &&
        matchesSaleStatus
      );
    });
  }, [
    sales,
    searchTerm,
    startDate,
    saleTypeFilter,
    paymentStatusFilter,
    saleStatusFilter,
  ]);

  const completedSales = sales.filter((sale) => sale.saleStatus === "completed");

  const totalSalesAmount = completedSales
    .filter((sale) => sale.paymentStatus !== "refunded")
    .reduce((total, sale) => total + Number(sale.grandTotal || 0), 0);

  const today = "2026-05-01";

  const todaySalesAmount = sales
    .filter(
      (sale) =>
        sale.saleDate === today &&
        sale.saleStatus === "completed" &&
        sale.paymentStatus !== "refunded"
    )
    .reduce((total, sale) => total + Number(sale.grandTotal || 0), 0);

  const refundedAmount = sales
    .filter((sale) => sale.paymentStatus === "refunded")
    .reduce((total, sale) => total + Number(sale.grandTotal || 0), 0);

  const pendingPaymentAmount = sales
    .filter(
      (sale) =>
        sale.paymentStatus === "partial" || sale.paymentStatus === "unpaid"
    )
    .reduce((total, sale) => total + Number(sale.grandTotal || 0), 0);

  const resetFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setSaleTypeFilter("All");
    setPaymentStatusFilter("All");
    setSaleStatusFilter("All");
  };

  const getPaymentSummary = (sale) => {
    if (!sale.payments.length) return "Unpaid";

    const providers = sale.payments.map((payment) => payment.providerName);
    const uniqueProviders = [...new Set(providers)];

    return uniqueProviders.join(" + ");
  };

  const getItemsCount = (sale) => {
    return sale.items.reduce((total, item) => total + Number(item.qty || 0), 0);
  };

  const getSaleStatusClass = (status) => {
    if (status === "completed") {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    }

    if (status === "confirmed") {
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    }

    if (status === "draft") {
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    }

    return "bg-red-500/10 text-red-500 dark:text-red-400";
  };

  const getSaleStatusIcon = (status) => {
    if (status === "completed") return <FiCheckCircle />;
    if (status === "confirmed") return <FiClock />;
    if (status === "draft") return <FiFileText />;
    return <FiXCircle />;
  };

  const getPaymentStatusClass = (status) => {
    if (status === "paid") {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    }

    if (status === "partial") {
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    }

    return "bg-red-500/10 text-red-500 dark:text-red-400";
  };

  const getPaymentStatusIcon = (status) => {
    if (status === "paid") return <FiCheckCircle />;
    if (status === "partial") return <FiClock />;
    if (status === "refunded") return <FiRefreshCcw />;
    return <FiXCircle />;
  };

  const openViewModal = (sale) => {
    setSelectedSale(sale);
    setReturnErrors({});
    setModalMode("view");
  };

  const openReturnModal = (sale) => {
    setSelectedSale(sale);
    setReturnErrors({});
    setReturnForm({
      ...emptyReturnForm,
      totalAmount: sale.grandTotal,
    });
    setModalMode("return");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedSale(null);
    setReturnForm(emptyReturnForm);
    setReturnErrors({});
  };

  const handleReturnFormChange = (field, value) => {
    setReturnForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setReturnErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  const handlePrint = (sale) => {
    setSales((previous) =>
      previous.map((item) =>
        item.id === sale.id
          ? {
              ...item,
              isPrinted: true,
              printedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
            }
          : item
      )
    );

    alert(`Receipt ${sale.saleNo} is ready to print.`);
  };

  const validateReturnForm = () => {
    const nextErrors = {};

    if (!returnForm.reason.trim()) {
      nextErrors.reason = "Return reason is required.";
    }

    if (!returnForm.totalAmount || Number(returnForm.totalAmount) <= 0) {
      nextErrors.totalAmount = "Return amount must be greater than 0.";
    }

    if (Number(returnForm.totalAmount || 0) > Number(selectedSale?.grandTotal || 0)) {
      nextErrors.totalAmount = "Return amount cannot exceed sale total.";
    }

    setReturnErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveReturn = () => {
    if (!selectedSale) return;
    if (!validateReturnForm()) return;

    const now = new Date().toISOString().slice(0, 10);

    setSales((previous) =>
      previous.map((sale) => {
        if (sale.id !== selectedSale.id) return sale;

        const nextReturn = {
          id: Date.now(),
          salesReturnNo: `SR-${String(sale.returns.length + 1).padStart(3, "0")}`,
          returnType: returnForm.returnType,
          resolutionType: returnForm.resolutionType,
          totalAmount: Number(returnForm.totalAmount || 0),
          reason: returnForm.reason.trim(),
          status: "completed",
          createdAt: now,
        };

        return {
          ...sale,
          paymentStatus:
            Number(returnForm.totalAmount) >= Number(sale.grandTotal)
              ? "refunded"
              : "partial",
          returns: [nextReturn, ...sale.returns],
          note: sale.note
            ? `${sale.note} Return: ${returnForm.reason}`
            : `Return: ${returnForm.reason}`,
        };
      })
    );

    closeModal();
  };

  return (
    <section className="space-y-6">
      {/* Page Action */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {/* <h1 className={`text-2xl font-bold ${theme.pageTitle}`}>Sales</h1>
          <p className={`mt-1 text-sm ${theme.muted}`}>
            Manage sale invoices, payment history, receipt printing, and returns.
          </p> */}
        </div>

        <Link
          to="/pos"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
        >
          Open POS
          <FiArrowUpRight className="text-lg" />
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          theme={theme}
          title="Total Sales"
          value={`$${totalSalesAmount.toFixed(2)}`}
          icon={<FiDollarSign className="text-[34px] text-emerald-500" />}
          iconBg="bg-emerald-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Today Sales"
          value={`$${todaySalesAmount.toFixed(2)}`}
          icon={<FiShoppingCart className="text-[34px] text-red-500" />}
          iconBg="bg-red-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Pending Payment"
          value={`$${pendingPaymentAmount.toFixed(2)}`}
          icon={<FiClock className="text-[34px] text-amber-500" />}
          iconBg="bg-amber-500/10"
        />

        <SummaryCard
          theme={theme}
          title="Refunded"
          value={`$${refundedAmount.toFixed(2)}`}
          icon={<FiRefreshCcw className="text-[34px] text-red-500" />}
          iconBg="bg-red-500/10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:max-w-6xl xl:grid-cols-[1.7fr_180px_180px_190px_190px]">
          <div className="relative">
            <FiSearch
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search invoice, customer, cashier, product..."
              className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
            />
          </div>

          <div className="relative">
            <FiCalendar
              className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
            />

            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className={`h-12 w-full rounded-2xl border pl-11 pr-4 text-sm outline-none transition focus:ring-4 ${theme.input}`}
            />
          </div>

          <FilterSelect
            icon={<FiUser />}
            value={saleTypeFilter}
            onChange={setSaleTypeFilter}
            theme={theme}
            options={[
              { value: "All", label: "All Type" },
              { value: "retail", label: "Retail" },
              { value: "wholesale", label: "Wholesale" },
            ]}
          />

          <FilterSelect
            icon={<FiCreditCard />}
            value={paymentStatusFilter}
            onChange={setPaymentStatusFilter}
            theme={theme}
            options={[
              { value: "All", label: "All Payment" },
              { value: "unpaid", label: "Unpaid" },
              { value: "partial", label: "Partial" },
              { value: "paid", label: "Paid" },
              { value: "refunded", label: "Refunded" },
            ]}
          />

          <FilterSelect
            icon={<FiFilter />}
            value={saleStatusFilter}
            onChange={setSaleStatusFilter}
            theme={theme}
            options={[
              { value: "All", label: "All Status" },
              { value: "draft", label: "Draft" },
              { value: "confirmed", label: "Confirmed" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <FiRotateCcw />
          Reset
        </button>
      </div>

      {/* Sales Table */}
      <div
        className={`overflow-hidden rounded-2xl border shadow-sm ${theme.tableWrap}`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className={`text-base font-semibold ${theme.pageTitle}`}>
              Sales List
            </h2>

            <p className={`mt-1 text-xs ${theme.muted}`}>
              Showing {filteredSales.length} of {sales.length} invoices
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1240px]">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Invoice
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Customer
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Items
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Payment
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Delivery
                </th>
                <th className="px-5 py-3 text-left text-sm font-semibold">
                  Total
                </th>
                <th className="px-5 py-3 text-center text-sm font-semibold">
                  Status
                </th>
                <th className="px-5 py-3 text-center text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id} className={`border-t transition ${theme.row}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
                        <FiHash size={21} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold leading-5">
                          {sale.saleNo}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${theme.badge}`}
                          >
                            {sale.saleType}
                          </span>

                          <span className={`text-xs ${theme.muted}`}>
                            {sale.displayDate} · {sale.cashierName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold">{sale.customerName}</p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      {sale.customerId ? "Wholesale customer" : "Walk-in sale"}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold">
                      {sale.items.length} line{sale.items.length > 1 ? "s" : ""} ·{" "}
                      {getItemsCount(sale)} qty
                    </p>

                    <p className={`mt-1 max-w-[260px] truncate text-xs ${theme.muted}`}>
                      {sale.items.map((item) => item.variantNameSnapshot).join(", ")}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                    >
                      <FiCreditCard />
                      {getPaymentSummary(sale)}
                    </span>

                    <div className="mt-2">
                      <StatusBadge
                        status={sale.paymentStatus}
                        getStatusClass={getPaymentStatusClass}
                        getStatusIcon={getPaymentStatusIcon}
                      />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    {sale.deliveryRequired ? (
                      <>
                        <p className="text-sm font-semibold capitalize">
                          {sale.deliveryOption.replaceAll("_", " ")}
                        </p>

                        <p className={`mt-1 text-xs ${theme.muted}`}>
                          Fee: ${Number(sale.deliveryFee || 0).toFixed(2)} ·{" "}
                          {sale.deliveryStatus}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold">Pickup</p>
                        <p className={`mt-1 text-xs ${theme.muted}`}>
                          No delivery
                        </p>
                      </>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-bold">
                      ${Number(sale.grandTotal).toFixed(2)}
                    </p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      Subtotal ${Number(sale.subtotal).toFixed(2)}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-center">
                    <StatusBadge
                      status={sale.saleStatus}
                      getStatusClass={getSaleStatusClass}
                      getStatusIcon={getSaleStatusIcon}
                    />
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        title="View invoice"
                        onClick={() => openViewModal(sale)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm transition hover:bg-amber-600"
                      >
                        <FiEye size={16} />
                      </button>

                      <button
                        type="button"
                        title="Print receipt"
                        onClick={() => handlePrint(sale)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm transition hover:bg-emerald-600"
                      >
                        <FiPrinter size={16} />
                      </button>

                      <button
                        type="button"
                        title="Return / refund"
                        disabled={
                          sale.paymentStatus === "refunded" ||
                          sale.saleStatus === "cancelled"
                        }
                        onClick={() => openReturnModal(sale)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiRotateCcw size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSales.length === 0 && (
                <tr className={`border-t ${theme.row}`}>
                  <td colSpan="8" className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${theme.softCard}`}
                      >
                        <FiSearch className={`text-3xl ${theme.muted}`} />
                      </div>

                      <p className={`mt-4 text-sm font-semibold ${theme.pageTitle}`}>
                        No sales found
                      </p>

                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        Try changing your search keyword, date, type, payment, or
                        status filter.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode === "view" && selectedSale && (
        <ViewSaleModal
          sale={selectedSale}
          theme={theme}
          onClose={closeModal}
          getPaymentSummary={getPaymentSummary}
          getSaleStatusClass={getSaleStatusClass}
          getSaleStatusIcon={getSaleStatusIcon}
          getPaymentStatusClass={getPaymentStatusClass}
          getPaymentStatusIcon={getPaymentStatusIcon}
        />
      )}

      {modalMode === "return" && selectedSale && (
        <ReturnSaleModal
          sale={selectedSale}
          form={returnForm}
          errors={returnErrors}
          theme={theme}
          onChange={handleReturnFormChange}
          onClose={closeModal}
          onSave={handleSaveReturn}
        />
      )}
    </section>
  );
}

function SummaryCard({ theme, title, value, icon, iconBg }) {
  return (
    <div className={`rounded-2xl border px-5 py-5 shadow-sm ${theme.card}`}>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg}`}
        >
          {icon}
        </div>

        <div>
          <p className={`text-sm font-medium ${theme.muted}`}>{title}</p>
          <h3 className="mt-1 text-3xl font-bold leading-none">{value}</h3>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ icon, value, onChange, options, theme }) {
  return (
    <div className="relative">
      <span
        className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
      >
        {icon}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-12 w-full appearance-none rounded-2xl border pl-11 pr-11 text-sm outline-none transition focus:ring-4 ${theme.select}`}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <FiChevronDown
        className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg ${theme.muted}`}
      />
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  theme,
  onClose,
  children,
  footer,
  width = "max-w-6xl",
}) {
  return (
    <div
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className={`flex h-auto max-h-[90dvh] w-full ${width} flex-col overflow-hidden rounded-3xl border shadow-2xl ${theme.modal}`}
      >
        <div className={`shrink-0 border-b px-6 py-5 ${theme.modalHeader}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>

              {subtitle && (
                <p className={`mt-1.5 text-sm leading-6 ${theme.muted}`}>
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-300 bg-zinc-100 text-zinc-700 shadow-sm transition hover:bg-zinc-200 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>

        <div
          className={`custom-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 ${theme.modalBody}`}
        >
          {children}
        </div>

        {footer && (
          <div className={`shrink-0 border-t px-6 py-4 ${theme.modalHeader}`}>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {footer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewSaleModal({
  sale,
  theme,
  onClose,
  getPaymentSummary,
  getSaleStatusClass,
  getSaleStatusIcon,
  getPaymentStatusClass,
  getPaymentStatusIcon,
}) {
  return (
    <ModalShell
      title={sale.saleNo}
      subtitle={`${sale.customerName} · ${sale.displayDate} · ${sale.cashierName}`}
      theme={theme}
      onClose={onClose}
      footer={
        <button
          type="button"
          onClick={onClose}
          className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
        >
          Close
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
        <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
            <FiShoppingCart size={38} />
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <InfoLine label="Invoice No" value={sale.saleNo} />
            <InfoLine label="Customer" value={sale.customerName} />
            <InfoLine label="Cashier" value={sale.cashierName} />
            <InfoLine label="Sale Type" value={sale.saleType} />
            <InfoLine label="Sale Channel" value={sale.saleChannel} />
            <InfoLine label="Currency" value={sale.invoiceCurrency} />
            <InfoLine
              label="Exchange Rate"
              value={`1 USD = ${sale.exchangeRateKhrPerUsd} KHR`}
            />

            <div>
              <p className="text-xs font-semibold text-zinc-500">Sale Status</p>
              <div className="mt-2">
                <StatusBadge
                  status={sale.saleStatus}
                  getStatusClass={getSaleStatusClass}
                  getStatusIcon={getSaleStatusIcon}
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-zinc-500">
                Payment Status
              </p>
              <div className="mt-2">
                <StatusBadge
                  status={sale.paymentStatus}
                  getStatusClass={getPaymentStatusClass}
                  getStatusIcon={getPaymentStatusIcon}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <FormSection
            title="Sale Items"
            subtitle="Product snapshots saved at sale time."
            icon={<FiPackage />}
            theme={theme}
          >
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-3 py-3 text-left">Product Variant</th>
                    <th className="px-3 py-3 text-left">Qty</th>
                    <th className="px-3 py-3 text-left">Base Qty</th>
                    <th className="px-3 py-3 text-left">Unit Price</th>
                    <th className="px-3 py-3 text-left">Discount</th>
                    <th className="px-3 py-3 text-left">Line Total</th>
                  </tr>
                </thead>

                <tbody>
                  {sale.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-zinc-200 dark:border-white/10"
                    >
                      <td className="px-3 py-3">
                        <p className="font-semibold">
                          {item.variantNameSnapshot}
                        </p>

                        <p className={`mt-1 text-xs ${theme.muted}`}>
                          {item.productNameSnapshot} · {item.unitNameSnapshot}
                        </p>
                      </td>

                      <td className="px-3 py-3">
                        {item.qty} {item.unitNameSnapshot}
                      </td>

                      <td className="px-3 py-3">{item.baseQty}</td>

                      <td className="px-3 py-3">
                        ${Number(item.unitPrice).toFixed(2)}
                      </td>

                      <td className="px-3 py-3">
                        ${Number(item.discountAmount).toFixed(2)}
                      </td>

                      <td className="px-3 py-3 font-semibold">
                        ${Number(item.lineTotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FormSection>

          <FormSection
            title="Payments"
            subtitle={`Payment summary: ${getPaymentSummary(sale)}`}
            icon={<FiCreditCard />}
            theme={theme}
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {sale.payments.length > 0 ? (
                sale.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className={`rounded-xl border p-4 ${theme.softCard}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        {payment.providerName}
                      </p>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.badge}`}
                      >
                        {payment.currencyCode}
                      </span>
                    </div>

                    <p className="mt-3 text-xl font-bold">
                      {payment.currencyCode === "KHR" ? "៛" : "$"}
                      {Number(payment.amountReceived).toLocaleString()}
                    </p>

                    <p className={`mt-1 text-xs ${theme.muted}`}>
                      Applied: $
                      {Number(payment.amountAppliedInvoiceCurrency).toFixed(2)}
                    </p>

                    {payment.referenceNo && (
                      <p className={`mt-1 text-xs ${theme.muted}`}>
                        Ref: {payment.referenceNo}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className={`text-sm ${theme.muted}`}>No payment records.</p>
              )}
            </div>
          </FormSection>

          <FormSection
            title="Summary"
            subtitle="Sale amount, discount, delivery fee, and grand total."
            icon={<FiDollarSign />}
            theme={theme}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <SummaryMiniBox
                theme={theme}
                label="Subtotal"
                value={`$${Number(sale.subtotal).toFixed(2)}`}
              />

              <SummaryMiniBox
                theme={theme}
                label="Discount"
                value={`$${Number(sale.discountTotal).toFixed(2)}`}
              />

              <SummaryMiniBox
                theme={theme}
                label="Delivery"
                value={`$${Number(sale.deliveryFee).toFixed(2)}`}
              />

              <SummaryMiniBox
                theme={theme}
                label="Grand Total"
                value={`$${Number(sale.grandTotal).toFixed(2)}`}
                strong
              />
            </div>

            {sale.deliveryRequired && (
              <div className="mt-5 rounded-xl border border-zinc-200 p-4 dark:border-white/10">
                <div className="flex items-start gap-3">
                  <FiMapPin className="mt-1 text-red-500" />

                  <div>
                    <p className="text-sm font-semibold">Delivery Address</p>

                    <p className={`mt-1 text-sm ${theme.muted}`}>
                      {sale.deliveryAddress || "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5">
              <p className={`text-xs font-semibold ${theme.muted}`}>Note</p>
              <p className="mt-2 text-sm leading-6">{sale.note || "-"}</p>
            </div>
          </FormSection>

          {sale.returns.length > 0 && (
            <FormSection
              title="Sales Returns"
              subtitle="Return or refund records for this invoice."
              icon={<FiRefreshCcw />}
              theme={theme}
            >
              <div className="space-y-3">
                {sale.returns.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 ${theme.softCard}`}
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          {item.salesReturnNo}
                        </p>

                        <p className={`mt-1 text-xs ${theme.muted}`}>
                          {item.returnType} · {item.resolutionType} ·{" "}
                          {item.createdAt}
                        </p>
                      </div>

                      <p className="text-sm font-bold">
                        ${Number(item.totalAmount).toFixed(2)}
                      </p>
                    </div>

                    <p className={`mt-2 text-xs ${theme.muted}`}>
                      {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            </FormSection>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

function ReturnSaleModal({
  sale,
  form,
  errors,
  theme,
  onChange,
  onClose,
  onSave,
}) {
  return (
    <ModalShell
      title="Return / Refund Sale"
      subtitle={`${sale.saleNo} · ${sale.customerName} · Total $${Number(
        sale.grandTotal
      ).toFixed(2)}`}
      theme={theme}
      onClose={onClose}
      width="max-w-4xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-zinc-300 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-100 hover:text-zinc-950 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 dark:hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white shadow-sm hover:bg-red-600"
          >
            <FiSave />
            Save Return
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400">
          <FiAlertTriangle className="mt-0.5 shrink-0" />

          <span>
            Return should create a sales return record. Good items can be
            restocked, damaged items should be handled in inventory adjustment.
          </span>
        </div>

        <FormSection
          title="Return Information"
          subtitle="Set return type, resolution, amount, and reason."
          icon={<FiRefreshCcw />}
          theme={theme}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormSelect
              label="Return Type"
              required
              value={form.returnType}
              onChange={(value) => onChange("returnType", value)}
              theme={theme}
              icon={<FiRefreshCcw />}
              options={[
                { value: "partial_return", label: "Partial Return" },
                { value: "full_return", label: "Full Return" },
              ]}
            />

            <FormSelect
              label="Resolution Type"
              required
              value={form.resolutionType}
              onChange={(value) => onChange("resolutionType", value)}
              theme={theme}
              icon={<FiInfo />}
              options={[
                { value: "refund", label: "Refund" },
                { value: "exchange", label: "Exchange" },
                { value: "credit_note", label: "Credit Note" },
              ]}
            />

            <FormInput
              label="Return Amount"
              required
              type="number"
              value={form.totalAmount}
              error={errors.totalAmount}
              onChange={(value) => onChange("totalAmount", value)}
              theme={theme}
              placeholder="0.00"
              icon={<FiDollarSign />}
            />

            <FormSelect
              label="Status"
              value={form.status}
              onChange={(value) => onChange("status", value)}
              theme={theme}
              icon={<FiClock />}
              options={[
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </div>

          <div className="mt-4">
            <FormTextarea
              label="Reason"
              value={form.reason}
              error={errors.reason}
              onChange={(value) => onChange("reason", value)}
              theme={theme}
              placeholder="Example: Customer returned damaged product..."
              icon={<FiFileText />}
            />
          </div>
        </FormSection>
      </div>
    </ModalShell>
  );
}

function FormSection({ title, subtitle, icon, theme, children }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${theme.section}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-bold">{title}</h3>

          {subtitle && (
            <p className={`mt-0.5 text-xs leading-5 ${theme.muted}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

function StatusBadge({ status, getStatusClass, getStatusIcon }) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(
        status
      )}`}
    >
      {getStatusIcon(status)}
      {status}
    </span>
  );
}

function FormInput({
  label,
  required = false,
  value,
  onChange,
  theme,
  error = "",
  type = "text",
  placeholder = "",
  icon,
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>

      <div className="relative">
        {icon && (
          <span
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}
          >
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full rounded-xl border ${
            icon ? "pl-10" : "px-3"
          } pr-3 text-sm outline-none transition focus:ring-4 ${theme.input} ${
            error ? "border-red-500 focus:border-red-500" : ""
          }`}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  theme,
  error = "",
  placeholder = "",
  icon,
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
      </span>

      <div className="relative">
        {icon && (
          <span
            className={`pointer-events-none absolute left-3.5 top-3.5 text-base ${theme.muted}`}
          >
            {icon}
          </span>
        )}

        <textarea
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className={`w-full resize-none rounded-xl border ${
            icon ? "pl-10" : "px-3"
          } pr-3 py-3 text-sm outline-none transition focus:ring-4 ${
            theme.input
          } ${error ? "border-red-500 focus:border-red-500" : ""}`}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function FormSelect({
  label,
  required = false,
  value,
  onChange,
  options,
  theme,
  error = "",
  icon,
  disabled = false,
}) {
  return (
    <label className="block">
      <span className={`mb-2 block text-xs font-semibold ${theme.muted}`}>
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>

      <div className="relative">
        {icon && (
          <span
            className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}
          >
            {icon}
          </span>
        )}

        <select
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={`h-11 w-full appearance-none rounded-xl border ${
            icon ? "pl-10" : "pl-3"
          } pr-10 text-sm outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-70 ${
            theme.select
          } ${error ? "border-red-500 focus:border-red-500" : ""}`}
        >
          {options.map((option) => (
            <option key={String(option.value)} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <FiChevronDown
          className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-base ${theme.muted}`}
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </label>
  );
}

function SummaryMiniBox({ theme, label, value, strong = false }) {
  return (
    <div className={`rounded-xl border p-4 ${theme.softCard}`}>
      <p className={`text-xs font-semibold ${theme.muted}`}>{label}</p>

      <p
        className={`mt-2 ${
          strong ? "text-xl font-bold" : "text-sm font-semibold"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1 capitalize">{value || "-"}</p>
    </div>
  );
}