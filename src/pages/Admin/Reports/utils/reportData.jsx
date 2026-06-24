import {
  FiAlertCircle,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiPackage,
  FiRefreshCw,
  FiRotateCcw,
  FiShoppingCart,
  FiTag,
} from "react-icons/fi";

export const STATS = {
  totalSalesUsd:      5_184.50,
  totalSalesKhr:      20_738_000,
  totalPurchasesUsd:  3_420.00,
  totalPurchasesKhr:  13_680_000,
  netCashUsd:         1_764.50,
  grossReturnUsd:       73.50,
  salesReturnsUsd:      46.50,
  purchaseReturnsUsd:   27.00,
  lowStockItems:           8,
  pendingClaims:           3,
  stockOnHand:        32_545,
  totalVariants:          48,
};

export const CHART_DATA = [
  { day: "Sun", sales: 2800, purchases: 900,  returns: 120 },
  { day: "Mon", sales: 1200, purchases: 500,  returns:  60 },
  { day: "Tue", sales: 1500, purchases: 1200, returns:  80 },
  { day: "Wed", sales: 1800, purchases: 700,  returns:  95 },
  { day: "Thu", sales:  900, purchases: 1100, returns:  40 },
  { day: "Fri", sales: 3400, purchases: 1300, returns: 150 },
  { day: "Sat", sales:  200, purchases:  400, returns:  20 },
];

export const TOP_PRODUCTS = [
  { id: 1, name: "Coca-Cola Can 330ml",     unit: "Can",    soldQty: 245, revenueUsd: 122.5,  stock: 4550,   status: "In Stock"   },
  { id: 2, name: "Face Mask Box",           unit: "Box",    soldQty:  84, revenueUsd: 336.0,  stock:  528,   status: "In Stock"   },
  { id: 3, name: "Dove Shampoo 250ml",      unit: "Bottle", soldQty:  42, revenueUsd: 189.0,  stock:   95,   status: "Low Stock"  },
  { id: 4, name: "Tiger Beer 330ml",        unit: "Can",    soldQty:  38, revenueUsd: 190.0,  stock:   12,   status: "Low Stock"  },
  { id: 5, name: "Sugar Loose",             unit: "Kg",     soldQty:  36, revenueUsd:  36.0,  stock: 25000,  status: "In Stock"   },
  { id: 6, name: "Maggi Noodles 5-pack",    unit: "Pack",   soldQty:  29, revenueUsd:  43.5,  stock:   80,   status: "In Stock"   },
];

export const LOW_STOCK = [
  { id: 1, name: "Coca-Cola Bottle 1.5L",  current:  8, threshold: 48, unit: "Bottle" },
  { id: 2, name: "Tiger Beer 330ml Can",   current: 12, threshold: 24, unit: "Can"    },
  { id: 3, name: "Dove Shampoo 500ml",     current:  9, threshold: 12, unit: "Bottle" },
  { id: 4, name: "Facial Spray",           current:  6, threshold: 10, unit: "Piece"  },
  { id: 5, name: "Milo Tin 400g",          current:  4, threshold: 12, unit: "Tin"    },
];

export const PAYMENT_BREAKDOWN = [
  { method: "Cash USD",   amountUsd: 2840.00, icon: FiDollarSign,  color: "text-emerald-500", bg: "bg-emerald-500/10", count: 38 },
  { method: "Cash KHR",   amountUsd:  300.00, icon: FiTag,         color: "text-blue-500",    bg: "bg-blue-500/10",   count: 14 },
  { method: "ABA / Bank", amountUsd: 1644.50, icon: FiCreditCard,  color: "text-violet-500",  bg: "bg-violet-500/10", count: 21 },
  { method: "Pending",    amountUsd:  400.00, icon: FiClock,       color: "text-amber-500",   bg: "bg-amber-500/10",  count:  6 },
];

export const RECENT_ACTIVITIES = [
  { id: 1, type: "sale",     icon: FiDollarSign,  label: "Sale Completed",             desc: "INV-012 Â· Walk-in Â· $48.50 paid by cash",            time: "12 min ago",  color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: 2, type: "stock_in", icon: FiPackage,     label: "Stock-In Confirmed",         desc: "PO-031 Â· ABC Supplier Â· 240 cans received",          time: "28 min ago",  color: "text-violet-500",  bg: "bg-violet-500/10"  },
  { id: 3, type: "purchase", icon: FiShoppingCart,label: "Purchase Created",           desc: "PO-034 Â· Mega Import Â· $1,200 Â· awaiting delivery",  time: "1 hr ago",    color: "text-blue-500",    bg: "bg-blue-500/10"    },
  { id: 4, type: "claim",    icon: FiAlertCircle, label: "Supplier Claim Pending",     desc: "PO-028 Â· 5 damaged cans Â· awaiting replacement",     time: "2 hr ago",    color: "text-orange-500",  bg: "bg-orange-500/10"  },
  { id: 5, type: "s_return", icon: FiRotateCcw,   label: "Sales Return Created",       desc: "SR-004 Â· INV-009 Â· $9.75 refunded to customer",      time: "3 hr ago",    color: "text-rose-500",    bg: "bg-rose-500/10"    },
  { id: 6, type: "p_return", icon: FiRefreshCw,   label: "Purchase Return Created",    desc: "PR-002 Â· PO-028 Â· 3 damaged items returned",        time: "4 hr ago",    color: "text-amber-500",   bg: "bg-amber-500/10"   },
  { id: 7, type: "stock_adj",icon: FiBarChart2,   label: "Stock Adjustment Approved",  desc: "ADJ-007 Â· 5 damaged Coca-Cola cans adjusted out",   time: "5 hr ago",    color: "text-cyan-500",    bg: "bg-cyan-500/10"    },
  { id: 8, type: "sale",     icon: FiCheckCircle, label: "Sale Completed",             desc: "INV-011 Â· Sokha Mart Â· $83.00 Â· partial payment",   time: "6 hr ago",    color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


