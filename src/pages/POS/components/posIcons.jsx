import React from "react";

function Icon({ children, className = "h-5 w-5", strokeWidth = 1.75 }) {
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

export const Search      = ({ className }) => <Icon className={className}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>;
export const ShoppingCart= ({ className }) => <Icon className={className}><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h9.8a1 1 0 0 0 1-.8L21 7H7"/></Icon>;
export const User        = ({ className }) => <Icon className={className}><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></Icon>;
export const Users       = ({ className }) => <Icon className={className}><path d="M16 21a6 6 0 0 0-12 0"/><circle cx="10" cy="8" r="4"/><path d="M22 21a6 6 0 0 0-4.5-5.8"/><path d="M16 4.5a4 4 0 0 1 0 7"/></Icon>;
export const Minus       = ({ className }) => <Icon className={className}><path d="M5 12h14"/></Icon>;
export const Plus        = ({ className }) => <Icon className={className}><path d="M12 5v14"/><path d="M5 12h14"/></Icon>;
export const Trash2      = ({ className }) => <Icon className={className}><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></Icon>;
export const Receipt     = ({ className }) => <Icon className={className}><path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3Z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h4"/></Icon>;
export const Printer     = ({ className }) => <Icon className={className}><path d="M7 8V4h10v4"/><rect x="6" y="14" width="12" height="6" rx="1"/><path d="M6 17H5a2 2 0 0 1-2-2v-3a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v3a2 2 0 0 1-2 2h-1"/><circle cx="17.5" cy="11.5" r=".5" fill="currentColor" stroke="none"/></Icon>;
export const Wallet      = ({ className }) => <Icon className={className}><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M16 12h2"/><circle cx="16" cy="12" r=".8" fill="currentColor" stroke="none"/></Icon>;
export const ArrowRightLeft=({ className }) => <Icon className={className}><path d="M17 4 21 8l-4 4"/><path d="M3 8h18"/><path d="m7 20-4-4 4-4"/><path d="M21 16H3"/></Icon>;
export const BadgeDollarSign=({ className }) => <Icon className={className}><path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4Z"/><path d="M12 7v10"/><path d="M15 9.5c0-1.1-1.3-2-3-2s-3 .9-3 2 1.3 2 3 2 3 .9 3 2-1.3 2-3 2-3-.9-3-2"/></Icon>;
export const ScanLine    = ({ className }) => <Icon className={className}><path d="M4 7V5a1 1 0 0 1 1-1h2"/><path d="M17 4h2a1 1 0 0 1 1 1v2"/><path d="M20 17v2a1 1 0 0 1-1 1h-2"/><path d="M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M5 12h14"/></Icon>;
export const Grid3X3     = ({ className }) => <Icon className={className}><rect x="4" y="4" width="5" height="5" rx="1"/><rect x="15" y="4" width="5" height="5" rx="1"/><rect x="4" y="15" width="5" height="5" rx="1"/><rect x="15" y="15" width="5" height="5" rx="1"/></Icon>;
export const Package2    = ({ className }) => <Icon className={className}><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"/><path d="M4 7.5V16.5L12 21l8-4.5V7.5"/><path d="M12 12v9"/></Icon>;
export const LogOut      = ({ className }) => <Icon className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></Icon>;
export const X           = ({ className }) => <Icon className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></Icon>;
export const CheckCircle = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></Icon>;
export const ChevronDown = ({ className }) => <Icon className={className}><path d="m6 9 6 6 6-6"/></Icon>;
export const Tag         = ({ className }) => <Icon className={className}><path d="M12 2H7a2 2 0 0 0-2 2v5l8.5 8.5a2 2 0 0 0 2.83 0l4.17-4.17a2 2 0 0 0 0-2.83L12 2Z"/><circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none"/></Icon>;
export const Truck       = ({ className }) => <Icon className={className}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></Icon>;
export const Percent     = ({ className }) => <Icon className={className}><path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></Icon>;
export const Phone       = ({ className }) => <Icon className={className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 5.91 5.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/></Icon>;
export const Globe       = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></Icon>;
export const Hash        = ({ className }) => <Icon className={className}><path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="M16 3l-2 18"/></Icon>;
export const Clock       = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></Icon>;
export const AlertCircle = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></Icon>;
export const Info        = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></Icon>;
export const Layers      = ({ className }) => <Icon className={className}><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></Icon>;
export const ClipboardList=({ className }) => <Icon className={className}><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 14h6"/><path d="M9 10h6"/><path d="M9 18h4"/></Icon>;
export const Maximize    = ({ className }) => <Icon className={className}><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></Icon>;
export const Minimize    = ({ className }) => <Icon className={className}><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></Icon>;
export const PauseCircle = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="10"/><line x1="10" y1="15" x2="10" y2="9"/><line x1="14" y1="15" x2="14" y2="9"/></Icon>;