export function getSettingTheme(isDark) {
  return {
    pageTitle: isDark ? "text-white" : "text-zinc-900",

    card: isDark
      ? "border-white/10 bg-[#18181b] text-white"
      : "border-zinc-200 bg-white text-zinc-900",

    muted: isDark ? "text-zinc-400" : "text-zinc-500",
    divider: isDark ? "border-white/10" : "border-zinc-200",
    dashedDivider: isDark ? "border-white/15" : "border-zinc-300",
    content: isDark ? "bg-[#0f0f11]" : "bg-zinc-50/60",
    sidebar: isDark
      ? "border-white/10 bg-[#151518]"
      : "border-zinc-200 bg-white/80",
    sidebarItem: isDark
      ? "border border-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
      : "border border-transparent text-zinc-600 hover:border-red-200 hover:bg-red-50 hover:text-zinc-950",
    outlineButton: isDark
      ? "border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"
      : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100",
    receiptPreview: isDark
      ? "border-white/10 bg-[#18181b] text-white"
      : "border-zinc-300 bg-white text-zinc-900",
    strengthTrack: isDark ? "bg-white/10" : "bg-zinc-200",

    input: isDark
      ? "border-white/10 bg-[#18181b] text-white placeholder:text-zinc-500 focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-red-400 focus:ring-red-400/20",

    select: isDark
      ? "border-white/10 bg-[#18181b] text-white focus:border-red-500 focus:ring-red-500/20"
      : "border-zinc-300 bg-white text-zinc-900 focus:border-red-400 focus:ring-red-400/20",

    softCard: isDark
      ? "border-white/10 bg-[#151518]"
      : "border-zinc-200 bg-white",

    section: isDark
      ? "border-white/10 bg-[#18181b]"
      : "border-zinc-200 bg-white",
  };
}
