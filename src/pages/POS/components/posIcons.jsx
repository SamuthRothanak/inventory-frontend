import React from "react";

function IconBase({ children, className = "h-5 w-5", strokeWidth = 2 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const Search = ({ className }) => (
  <IconBase className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </IconBase>
);

export const ShoppingCart = ({ className }) => (
  <IconBase className={className}>
    <circle cx="9" cy="20" r="1" />
    <circle cx="18" cy="20" r="1" />
    <path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h9.8a1 1 0 0 0 1-.8L21 7H7" />
  </IconBase>
);

export const User = ({ className }) => (
  <IconBase className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0" />
  </IconBase>
);

export const Users = ({ className }) => (
  <IconBase className={className}>
    <path d="M16 21a6 6 0 0 0-12 0" />
    <circle cx="10" cy="8" r="4" />
    <path d="M22 21a6 6 0 0 0-4.5-5.8" />
    <path d="M16 4.5a4 4 0 0 1 0 7" />
  </IconBase>
);

export const Minus = ({ className }) => (
  <IconBase className={className}>
    <path d="M5 12h14" />
  </IconBase>
);

export const Plus = ({ className }) => (
  <IconBase className={className}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </IconBase>
);

export const Trash2 = ({ className }) => (
  <IconBase className={className}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </IconBase>
);

export const Receipt = ({ className }) => (
  <IconBase className={className}>
    <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3Z" />
    <path d="M9 8h6" />
    <path d="M9 12h6" />
  </IconBase>
);

export const Printer = ({ className }) => (
  <IconBase className={className}>
    <path d="M7 8V4h10v4" />
    <rect x="6" y="14" width="12" height="6" rx="1" />
    <path d="M6 17H5a2 2 0 0 1-2-2v-3a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v3a2 2 0 0 1-2 2h-1" />
  </IconBase>
);

export const Wallet = ({ className }) => (
  <IconBase className={className}>
    <path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    <path d="M16 12h4" />
    <circle cx="16" cy="12" r="0.8" fill="currentColor" stroke="none" />
  </IconBase>
);

export const ArrowRightLeft = ({ className }) => (
  <IconBase className={className}>
    <path d="M17 4 21 8l-4 4" />
    <path d="M3 8h18" />
    <path d="m7 20-4-4 4-4" />
    <path d="M21 16H3" />
  </IconBase>
);

export const BadgeDollarSign = ({ className }) => (
  <IconBase className={className}>
    <path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4Z" />
    <path d="M12 7v10" />
    <path d="M15 9.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2" />
  </IconBase>
);

export const ScanLine = ({ className }) => (
  <IconBase className={className}>
    <path d="M4 7V5a1 1 0 0 1 1-1h2" />
    <path d="M17 4h2a1 1 0 0 1 1 1v2" />
    <path d="M20 17v2a1 1 0 0 1-1 1h-2" />
    <path d="M7 20H5a1 1 0 0 1-1-1v-2" />
    <path d="M5 12h14" />
  </IconBase>
);

export const Grid3X3 = ({ className }) => (
  <IconBase className={className}>
    <rect x="4" y="4" width="5" height="5" rx="1" />
    <rect x="15" y="4" width="5" height="5" rx="1" />
    <rect x="4" y="15" width="5" height="5" rx="1" />
    <rect x="15" y="15" width="5" height="5" rx="1" />
  </IconBase>
);

export const Package2 = ({ className }) => (
  <IconBase className={className}>
    <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
    <path d="M4 7.5V16.5L12 21l8-4.5V7.5" />
    <path d="M12 12v9" />
  </IconBase>
);

export const LogOut = ({ className }) => (
  <IconBase className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </IconBase>
);

export const X = ({ className }) => (
  <IconBase className={className}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </IconBase>
);