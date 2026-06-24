import { FiBox, FiShoppingCart, FiTruck, FiUser } from "react-icons/fi";

export const settingSections = [
  {
    id: "shop",
    title: "Shop Profile",
    description: "Store information, receipt footer, and contact detail.",
    icon: FiUser,
  },
  {
    id: "sales",
    title: "Sales Settings",
    description: "POS, split payment, sales return, and stock-out behavior.",
    icon: FiShoppingCart,
  },
  {
    id: "purchases",
    title: "Purchase Settings",
    description: "Supplier purchase, prepaid, stock-in, and claim flow.",
    icon: FiTruck,
  },
  {
    id: "inventory",
    title: "Inventory Settings",
    description: "Low stock, expiry, batch, and stock adjustment rules.",
    icon: FiBox,
  },
];
